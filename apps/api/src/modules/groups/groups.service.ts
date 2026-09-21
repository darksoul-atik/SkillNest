import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Types, FilterQuery } from 'mongoose';
import { nanoid } from 'nanoid';
import {
  CreateGroupInput,
  UpdateGroupInput,
  GroupResponse,
  UserRole,
  GroupStatus,
  GroupCategory,
} from '@skillnest/shared';
import { GroupsRepository } from './groups.repository';
import { GroupDocument } from './schemas/group.schema';
import { GroupPolicy } from './policies/group.policy';
import { GroupMapper } from './dto/group.mapper';
import { MembershipMapper } from './dto/membership.mapper';
import { UsersService } from '../users/users.service';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly usersService: UsersService,
  ) {}

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return `${base || 'group'}-${nanoid(6).toLowerCase()}`;
  }

  async create(userId: string, input: CreateGroupInput): Promise<GroupResponse> {
    const startDate = new Date(input.startDate);
    if (startDate <= new Date()) {
      throw new BadRequestException('Start date must be in the future');
    }

    const hostObjectId = new Types.ObjectId(userId);
    const hostUser = await this.usersService.findById(hostObjectId);

    const slug = this.generateSlug(input.name);
    const group = await this.groupsRepository.create({
      name: input.name.trim(),
      slug,
      description: input.description.trim(),
      category: input.category as GroupCategory,
      location: input.location.trim(),
      coverMediaId: input.coverMediaId ? new Types.ObjectId(input.coverMediaId) : null,
      maxMembers: input.maxMembers,
      memberCount: 1,
      startDate,
      hostId: hostObjectId,
      status: GroupStatus.ACTIVE,
    });

    await this.groupsRepository.createHostMembership(group._id, hostObjectId);
    return GroupMapper.toResponse(group, hostUser, userId, true);
  }

  async findBySlugOrId(idOrSlug: string, currentUserId?: string): Promise<GroupResponse> {
    const group = await this.groupsRepository.findBySlugOrId(idOrSlug);
    if (!group) throw new NotFoundException('Group not found');

    const host = await this.usersService.findById(group.hostId);
    let isMember = false;
    if (currentUserId) {
      const membership = await this.groupsRepository.findMembership(
        group._id,
        new Types.ObjectId(currentUserId),
      );
      isMember = !!membership;
    }

    return GroupMapper.toResponse(group, host, currentUserId, isMember);
  }

  async findAll(
    params: {
      category?: GroupCategory;
      status?: GroupStatus;
      search?: string;
      limit?: number;
      cursor?: string;
    },
    currentUserId?: string,
  ) {
    const filter: FilterQuery<GroupDocument> = {};
    if (params.category) filter.category = params.category;
    filter.status = params.status || GroupStatus.ACTIVE;

    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { description: { $regex: params.search, $options: 'i' } },
        { location: { $regex: params.search, $options: 'i' } },
      ];
    }

    const limit = Math.min(params.limit || 20, 50);
    const paginated = await this.groupsRepository.findPaginated(filter, limit, params.cursor);

    const data = await Promise.all(
      paginated.data.map(async (grp) => {
        const host = await this.usersService.findById(grp.hostId);
        return GroupMapper.toResponse(grp, host, currentUserId);
      }),
    );

    return { data, meta: paginated.meta };
  }

  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    input: UpdateGroupInput,
  ): Promise<GroupResponse> {
    const group = await this.groupsRepository.findById(id);
    if (!group) throw new NotFoundException('Group not found');

    if (!GroupPolicy.canEdit({ id: userId, role: userRole }, group)) {
      throw new ForbiddenException('You do not have permission to edit this group');
    }

    const updateData: Partial<GroupDocument> = {};
    if (input.name) updateData.name = input.name.trim();
    if (input.description) updateData.description = input.description.trim();
    if (input.category) updateData.category = input.category as GroupCategory;
    if (input.location) updateData.location = input.location.trim();
    if (input.maxMembers) {
      if (input.maxMembers < group.memberCount) {
        throw new BadRequestException('Max members cannot be lower than current member count');
      }
      updateData.maxMembers = input.maxMembers;
    }
    if (input.startDate) {
      const d = new Date(input.startDate);
      if (d <= new Date()) throw new BadRequestException('Start date must be in the future');
      updateData.startDate = d;
    }
    if (input.coverMediaId !== undefined) {
      updateData.coverMediaId = input.coverMediaId ? new Types.ObjectId(input.coverMediaId) : null;
    }

    const updated = await this.groupsRepository.updateById(id, updateData);
    const host = await this.usersService.findById(updated!.hostId);
    return GroupMapper.toResponse(updated!, host, userId, true);
  }

  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const group = await this.groupsRepository.findById(id);
    if (!group) throw new NotFoundException('Group not found');

    if (!GroupPolicy.canDelete({ id: userId, role: userRole }, group)) {
      throw new ForbiddenException('You do not have permission to delete this group');
    }

    await this.groupsRepository.softDelete(id);
  }

  async join(groupId: string, userId: string) {
    const group = await this.groupsRepository.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const membership = await this.groupsRepository.joinGroupAtomic(
      new Types.ObjectId(groupId),
      new Types.ObjectId(userId),
    );
    return MembershipMapper.toResponse(membership);
  }

  async leave(groupId: string, userId: string): Promise<void> {
    const group = await this.groupsRepository.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (!GroupPolicy.canLeave({ id: userId, role: UserRole.USER }, group)) {
      throw new BadRequestException('Host cannot leave group. You must delete the group instead.');
    }

    const removed = await this.groupsRepository.leaveGroupAtomic(
      new Types.ObjectId(groupId),
      new Types.ObjectId(userId),
    );
    if (!removed) throw new NotFoundException('You are not a member of this group');
  }

  async removeMember(
    groupId: string,
    targetUserId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const group = await this.groupsRepository.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (!GroupPolicy.canRemoveMember({ id: userId, role: userRole }, group, targetUserId)) {
      throw new ForbiddenException('You do not have permission to remove this member');
    }

    const removed = await this.groupsRepository.leaveGroupAtomic(
      new Types.ObjectId(groupId),
      new Types.ObjectId(targetUserId),
    );
    if (!removed) throw new NotFoundException('Member not found in group');
  }

  async getMembers(groupId: string, limit = 20, cursor?: string) {
    const group = await this.groupsRepository.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const paginated = await this.groupsRepository.findMembersByGroupId(
      new Types.ObjectId(groupId),
      limit,
      cursor,
    );

    const data = paginated.data.map((m) => MembershipMapper.toResponse(m));
    return { data, meta: paginated.meta };
  }

  async getUserGroups(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const memberships = await this.groupsRepository.findMembershipsByUserId(userObjId);
    const groupIds = memberships.map((m) => m.groupId);

    const groups = await Promise.all(
      groupIds.map((gid) => this.groupsRepository.findById(gid)),
    );

    const validGroups = groups.filter((g): g is GroupDocument => g !== null);
    const host = await this.usersService.findById(userObjId);

    return validGroups.map((g) =>
      GroupMapper.toResponse(g, host, userId, true),
    );
  }
}
