import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { UserMapper } from '../users/dto/user.mapper';
import { CursorPaginationQueryDto, UpdateUserRoleDto, UpdateUserStatusDto } from './dto/admin.dto';
import { UserResponse, CursorPaginationMeta } from '@skillnest/shared';
import { Types } from 'mongoose';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {}

  async getUsers(query: CursorPaginationQueryDto): Promise<{ data: UserResponse[]; meta: CursorPaginationMeta }> {
    const limit = query.limit || 12;
    const filter: Record<string, unknown> = {};

    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { email: { $regex: query.q, $options: 'i' } },
      ];
    }

    if (query.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8'));
        const cursorDate = new Date(decoded.sortValue);
        const cursorId = new Types.ObjectId(decoded.id);

        filter.$or = [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ];
      } catch {
        // Fall back to beginning if cursor decoding fails
      }
    }

    const docs = await this.usersRepository.findPaginated(filter, limit + 1);
    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1]!;
      const payload = {
        sortValue: lastItem.createdAt.toISOString(),
        id: lastItem._id.toString(),
      };
      nextCursor = Buffer.from(JSON.stringify(payload)).toString('base64url');
    }

    const total = await this.usersRepository.countTotal();

    return {
      data: items.map(UserMapper.toResponse),
      meta: {
        nextCursor,
        hasMore,
        limit,
        total,
      },
    };
  }

  async updateUserRole(id: string, dto: UpdateUserRoleDto): Promise<UserResponse> {
    return this.usersService.updateUserRole(id, dto.role);
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto): Promise<UserResponse> {
    return this.usersService.updateUserStatus(id, dto.isActive);
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    totalGroups: number;
    totalComments: number;
  }> {
    const totalUsers = await this.usersRepository.countTotal();
    const activeUsers = await this.usersRepository.countTotal({ isActive: true });
    const adminUsers = await this.usersRepository.countTotal({ role: 'admin' });

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      totalGroups: 0,
      totalComments: 0,
    };
  }
}
