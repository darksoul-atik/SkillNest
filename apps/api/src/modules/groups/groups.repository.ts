import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { Membership, MembershipDocument } from './schemas/membership.schema';
import { GroupStatus, MembershipRole } from '@skillnest/shared';
import { CursorPaginationHelper } from '../../common/pagination/cursor-pagination.helper';

@Injectable()
export class GroupsRepository {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(Membership.name) private readonly membershipModel: Model<MembershipDocument>,
  ) {}

  async create(data: Partial<Group>): Promise<GroupDocument> {
    const group = new this.groupModel(data);
    return group.save();
  }

  async findById(id: string | Types.ObjectId): Promise<GroupDocument | null> {
    return this.groupModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async findBySlugOrId(idOrSlug: string): Promise<GroupDocument | null> {
    const isObjId = Types.ObjectId.isValid(idOrSlug) && idOrSlug.length === 24;
    const filter: FilterQuery<GroupDocument> = {
      deletedAt: null,
      ...(isObjId ? { $or: [{ _id: new Types.ObjectId(idOrSlug) }, { slug: idOrSlug.toLowerCase() }] } : { slug: idOrSlug.toLowerCase() }),
    };
    return this.groupModel.findOne(filter).exec();
  }

  async updateById(id: string | Types.ObjectId, data: Partial<Group>): Promise<GroupDocument | null> {
    return this.groupModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: data }, { new: true }).exec();
  }

  async softDelete(id: string | Types.ObjectId): Promise<GroupDocument | null> {
    return this.groupModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), status: GroupStatus.CANCELLED } },
      { new: true },
    ).exec();
  }

  async findPaginated(filter: FilterQuery<GroupDocument>, limit: number, cursor?: string) {
    const decoded = CursorPaginationHelper.decode(cursor);
    const cursorFilter = CursorPaginationHelper.buildFilter(decoded, 'createdAt', -1, true);
    const combinedFilter = { ...filter, ...cursorFilter, deletedAt: null };

    const docs = await this.groupModel
      .find(combinedFilter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const total = await this.groupModel.countDocuments({ ...filter, deletedAt: null }).exec();
    return CursorPaginationHelper.paginate(docs, limit, (d) => d.createdAt, total);
  }

  async joinGroupAtomic(groupId: Types.ObjectId, userId: Types.ObjectId): Promise<MembershipDocument> {
    // 1. Check if already member
    const existing = await this.membershipModel.findOne({ groupId, userId }).exec();
    if (existing) {
      throw new ConflictException('You are already a member of this group');
    }

    // 2. Atomic conditional increment: only increment if memberCount < maxMembers and not started
    const now = new Date();
    const updated = await this.groupModel.findOneAndUpdate(
      {
        _id: groupId,
        status: GroupStatus.ACTIVE,
        deletedAt: null,
        $expr: { $lt: ['$memberCount', '$maxMembers'] },
        startDate: { $gt: now },
      },
      { $inc: { memberCount: 1 } },
      { new: true },
    ).exec();

    if (!updated) {
      throw new ConflictException('Group is full, already started, or no longer active');
    }

    // 3. Create membership document
    try {
      const membership = new this.membershipModel({
        groupId,
        userId,
        role: MembershipRole.MEMBER,
        joinedAt: new Date(),
      });
      return await membership.save();
    } catch (err: unknown) {
      // Rollback the increment if unique constraint was violated in race
      await this.groupModel.updateOne({ _id: groupId }, { $inc: { memberCount: -1 } }).exec();
      if ((err as { code?: number }).code === 11000) {
        throw new ConflictException('You are already a member of this group');
      }
      throw err;
    }
  }

  async leaveGroupAtomic(groupId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
    const deleted = await this.membershipModel.findOneAndDelete({ groupId, userId }).exec();
    if (deleted) {
      await this.groupModel.updateOne({ _id: groupId }, { $inc: { memberCount: -1 } }).exec();
      return true;
    }
    return false;
  }

  async createHostMembership(groupId: Types.ObjectId, userId: Types.ObjectId): Promise<MembershipDocument> {
    const membership = new this.membershipModel({
      groupId,
      userId,
      role: MembershipRole.HOST,
      joinedAt: new Date(),
    });
    return membership.save();
  }

  async findMembership(groupId: Types.ObjectId, userId: Types.ObjectId): Promise<MembershipDocument | null> {
    return this.membershipModel.findOne({ groupId, userId }).exec();
  }

  async findMembershipsByUserId(userId: Types.ObjectId): Promise<MembershipDocument[]> {
    return this.membershipModel.find({ userId }).sort({ joinedAt: -1 }).exec();
  }

  async findMembersByGroupId(groupId: Types.ObjectId, limit: number, cursor?: string) {
    const decoded = CursorPaginationHelper.decode(cursor);
    const cursorFilter = CursorPaginationHelper.buildFilter(decoded, 'joinedAt', -1, true);
    const filter = { groupId, ...cursorFilter };

    const docs = await this.membershipModel
      .find(filter)
      .sort({ joinedAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('userId', 'name email avatarMediaId')
      .exec();

    const total = await this.membershipModel.countDocuments({ groupId }).exec();
    return CursorPaginationHelper.paginate(docs, limit, (d) => d.joinedAt, total);
  }
}
