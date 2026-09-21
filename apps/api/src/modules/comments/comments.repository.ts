import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Reply, ReplyDocument } from './schemas/reply.schema';
import { CursorPaginationHelper } from '../../common/pagination/cursor-pagination.helper';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Reply.name) private readonly replyModel: Model<ReplyDocument>,
  ) {}

  async createComment(data: Partial<Comment>): Promise<CommentDocument> {
    const comment = new this.commentModel(data);
    return comment.save();
  }

  async findCommentById(id: string | Types.ObjectId): Promise<CommentDocument | null> {
    return this.commentModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async updateComment(id: string | Types.ObjectId, data: Partial<Comment>): Promise<CommentDocument | null> {
    return this.commentModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: data }, { new: true }).exec();
  }

  async softDeleteComment(id: string | Types.ObjectId): Promise<CommentDocument | null> {
    return this.commentModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), body: '[deleted]' } },
      { new: true },
    ).exec();
  }

  async findCommentsByGroupId(groupId: Types.ObjectId, limit: number, cursor?: string) {
    const decoded = CursorPaginationHelper.decode(cursor);
    const cursorFilter = CursorPaginationHelper.buildFilter(decoded, 'createdAt', -1, true);
    const filter: FilterQuery<CommentDocument> = {
      groupId,
      deletedAt: null,
      ...cursorFilter,
    };

    const docs = await this.commentModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('authorId', 'name avatarMediaId role')
      .exec();

    const total = await this.commentModel.countDocuments({ groupId, deletedAt: null }).exec();
    return CursorPaginationHelper.paginate(docs, limit, (d) => d.createdAt, total);
  }

  async createReply(data: Partial<Reply>): Promise<ReplyDocument> {
    const reply = new this.replyModel(data);
    const saved = await reply.save();
    await this.commentModel.updateOne(
      { _id: data.commentId },
      { $inc: { replyCount: 1 } },
    ).exec();
    return saved;
  }

  async findReplyById(id: string | Types.ObjectId): Promise<ReplyDocument | null> {
    return this.replyModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async updateReply(id: string | Types.ObjectId, data: Partial<Reply>): Promise<ReplyDocument | null> {
    return this.replyModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: data }, { new: true }).exec();
  }

  async softDeleteReply(id: string | Types.ObjectId): Promise<ReplyDocument | null> {
    const reply = await this.replyModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), body: '[deleted]' } },
      { new: true },
    ).exec();

    if (reply) {
      await this.commentModel.updateOne(
        { _id: reply.commentId, replyCount: { $gt: 0 } },
        { $inc: { replyCount: -1 } },
      ).exec();
    }
    return reply;
  }

  async findRepliesByCommentId(commentId: Types.ObjectId, limit = 50): Promise<ReplyDocument[]> {
    return this.replyModel
      .find({ commentId, deletedAt: null })
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit)
      .populate('authorId', 'name avatarMediaId role')
      .exec();
  }
}
