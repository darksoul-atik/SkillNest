import { CommentResponse, ReplyResponse, CommentAuthor, ReplyAuthor } from '@skillnest/shared';
import { CommentDocument } from '../schemas/comment.schema';
import { ReplyDocument } from '../schemas/reply.schema';
import { UserDocument } from '../../users/schemas/user.schema';

export class CommentMapper {
  static toReplyResponse(
    reply: ReplyDocument & { authorId: UserDocument | any },
    currentUserId?: string,
  ): ReplyResponse {
    const authorDoc = reply.authorId as UserDocument;
    const isPopulated = authorDoc && typeof authorDoc === 'object' && '_id' in authorDoc;
    const authorId = isPopulated ? authorDoc._id.toString() : reply.authorId.toString();
    const avatarId = isPopulated && authorDoc.avatarMediaId ? authorDoc.avatarMediaId.toString() : null;

    const author: ReplyAuthor = {
      id: authorId,
      name: isPopulated ? authorDoc.name : 'Unknown User',
      avatarUrl: avatarId ? `/api/v1/media/${avatarId}` : null,
      avatarThumbUrl: avatarId ? `/api/v1/media/${avatarId}/thumb` : null,
      roleBadge: isPopulated && authorDoc.role === 'admin' ? 'Admin' : undefined,
    };

    return {
      id: reply._id.toString(),
      commentId: reply.commentId.toString(),
      groupId: reply.groupId.toString(),
      authorId,
      author,
      body: reply.body,
      editedAt: reply.editedAt ? reply.editedAt.toISOString() : null,
      isAuthor: currentUserId ? currentUserId === authorId : false,
      createdAt: reply.createdAt.toISOString(),
    };
  }

  static toCommentResponse(
    comment: CommentDocument & { authorId: UserDocument | any },
    currentUserId?: string,
    isHostOrAdmin = false,
    repliesPreview: ReplyResponse[] = [],
  ): CommentResponse {
    const authorDoc = comment.authorId as UserDocument;
    const isPopulated = authorDoc && typeof authorDoc === 'object' && '_id' in authorDoc;
    const authorId = isPopulated ? authorDoc._id.toString() : comment.authorId.toString();
    const avatarId = isPopulated && authorDoc.avatarMediaId ? authorDoc.avatarMediaId.toString() : null;

    const isAuthor = currentUserId ? currentUserId === authorId : false;
    const canDelete = isAuthor || isHostOrAdmin;

    const author: CommentAuthor = {
      id: authorId,
      name: isPopulated ? authorDoc.name : 'Unknown User',
      avatarUrl: avatarId ? `/api/v1/media/${avatarId}` : null,
      avatarThumbUrl: avatarId ? `/api/v1/media/${avatarId}/thumb` : null,
      roleBadge: isPopulated && authorDoc.role === 'admin' ? 'Admin' : undefined,
    };

    return {
      id: comment._id.toString(),
      groupId: comment.groupId.toString(),
      authorId,
      author,
      body: comment.body,
      editedAt: comment.editedAt ? comment.editedAt.toISOString() : null,
      replyCount: comment.replyCount,
      repliesPreview,
      isAuthor,
      canDelete,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
