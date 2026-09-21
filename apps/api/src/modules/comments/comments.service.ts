import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  CreateCommentInput,
  UpdateCommentInput,
  CreateReplyInput,
  UpdateReplyInput,
  UserRole,
} from '@skillnest/shared';
import { CommentsRepository } from './comments.repository';
import { CommentPolicy } from './policies/comment.policy';
import { CommentMapper } from './dto/comment.mapper';
import { GroupsRepository } from '../groups/groups.repository';
import { UsersService } from '../users/users.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly groupsRepository: GroupsRepository,
    private readonly usersService: UsersService,
  ) {}

  async createComment(groupId: string, userId: string, input: CreateCommentInput) {
    const group = await this.groupsRepository.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const authorObjId = new Types.ObjectId(userId);
    const comment = await this.commentsRepository.createComment({
      groupId: group._id,
      authorId: authorObjId,
      body: input.body.trim(),
    });

    const author = await this.usersService.findById(authorObjId);
    return CommentMapper.toCommentResponse(
      Object.assign(comment, { authorId: author }),
      userId,
      false,
      [],
    );
  }

  async findCommentsByGroupId(
    groupId: string,
    limit = 20,
    cursor?: string,
    currentUserId?: string,
    currentUserRole?: UserRole,
  ) {
    const group = await this.groupsRepository.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const isHostOrAdmin = Boolean(
      currentUserRole === UserRole.ADMIN ||
      (currentUserId && group.hostId.toString() === currentUserId),
    );

    const paginated = await this.commentsRepository.findCommentsByGroupId(
      group._id,
      limit,
      cursor,
    );

    const data = await Promise.all(
      paginated.data.map(async (comment) => {
        const replies = await this.commentsRepository.findRepliesByCommentId(comment._id, 3);
        const mappedReplies = replies.map((r) => CommentMapper.toReplyResponse(r, currentUserId));
        return CommentMapper.toCommentResponse(comment, currentUserId, isHostOrAdmin, mappedReplies);
      }),
    );

    return { data, meta: paginated.meta };
  }

  async updateComment(
    commentId: string,
    userId: string,
    userRole: UserRole,
    input: UpdateCommentInput,
  ) {
    const comment = await this.commentsRepository.findCommentById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    if (!CommentPolicy.canEditComment({ id: userId, role: userRole }, comment)) {
      throw new ForbiddenException('You do not have permission to edit this comment');
    }

    const updated = await this.commentsRepository.updateComment(commentId, {
      body: input.body.trim(),
      editedAt: new Date(),
    });
    const author = await this.usersService.findById(updated!.authorId);
    return CommentMapper.toCommentResponse(Object.assign(updated!, { authorId: author }), userId);
  }

  async deleteComment(commentId: string, userId: string, userRole: UserRole) {
    const comment = await this.commentsRepository.findCommentById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const group = await this.groupsRepository.findById(comment.groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (!CommentPolicy.canDeleteComment({ id: userId, role: userRole }, comment, group)) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.commentsRepository.softDeleteComment(commentId);
  }

  async createReply(
    commentId: string,
    userId: string,
    userRole: UserRole,
    input: CreateReplyInput,
  ) {
    const comment = await this.commentsRepository.findCommentById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const group = await this.groupsRepository.findById(comment.groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (!CommentPolicy.canReply({ id: userId, role: userRole }, group)) {
      throw new ForbiddenException('Only the group host can reply to inquiries');
    }

    const authorObjId = new Types.ObjectId(userId);
    const reply = await this.commentsRepository.createReply({
      commentId: comment._id,
      groupId: group._id,
      authorId: authorObjId,
      body: input.body.trim(),
    });

    const author = await this.usersService.findById(authorObjId);
    return CommentMapper.toReplyResponse(Object.assign(reply, { authorId: author }), userId);
  }

  async findRepliesByCommentId(commentId: string, currentUserId?: string) {
    const comment = await this.commentsRepository.findCommentById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const replies = await this.commentsRepository.findRepliesByCommentId(comment._id, 100);
    return replies.map((r) => CommentMapper.toReplyResponse(r, currentUserId));
  }

  async updateReply(
    replyId: string,
    userId: string,
    userRole: UserRole,
    input: UpdateReplyInput,
  ) {
    const reply = await this.commentsRepository.findReplyById(replyId);
    if (!reply) throw new NotFoundException('Reply not found');

    if (!CommentPolicy.canEditReply({ id: userId, role: userRole }, reply)) {
      throw new ForbiddenException('You do not have permission to edit this reply');
    }

    const updated = await this.commentsRepository.updateReply(replyId, {
      body: input.body.trim(),
      editedAt: new Date(),
    });
    const author = await this.usersService.findById(updated!.authorId);
    return CommentMapper.toReplyResponse(Object.assign(updated!, { authorId: author }), userId);
  }

  async deleteReply(replyId: string, userId: string, userRole: UserRole) {
    const reply = await this.commentsRepository.findReplyById(replyId);
    if (!reply) throw new NotFoundException('Reply not found');

    const group = await this.groupsRepository.findById(reply.groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (!CommentPolicy.canDeleteReply({ id: userId, role: userRole }, reply, group)) {
      throw new ForbiddenException('You do not have permission to delete this reply');
    }

    await this.commentsRepository.softDeleteReply(replyId);
  }
}
