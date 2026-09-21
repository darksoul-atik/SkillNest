import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';
import { UserMapper } from './dto/user.mapper';
import { UserResponse, UserProfile, UserRole } from '@skillnest/shared';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmail(email);
  }

  async getUserResponseById(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserMapper.toResponse(user);
  }

  async getPublicProfile(id: string): Promise<UserProfile> {
    const user = await this.usersRepository.findById(id);
    if (!user || !user.isActive) {
      throw new NotFoundException('User profile not found or inactive');
    }

    const avatarMediaId = user.avatarMediaId ? user.avatarMediaId.toString() : null;

    return {
      id: user._id.toString(),
      name: user.name,
      avatarUrl: avatarMediaId ? `/api/v1/media/${avatarMediaId}` : null,
      avatarThumbUrl: avatarMediaId ? `/api/v1/media/${avatarMediaId}/thumb` : null,
      role: user.role,
      hostedGroupsCount: 0,
      joinedGroupsCount: 0,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateUserRole(id: string, role: UserRole): Promise<UserResponse> {
    const user = await this.usersRepository.updateById(id, { role });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserMapper.toResponse(user);
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<UserResponse> {
    const user = await this.usersRepository.updateById(id, { isActive });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserMapper.toResponse(user);
  }
}
