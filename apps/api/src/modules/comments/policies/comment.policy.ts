import { UserRole } from '@skillnest/shared';
import { CommentDocument } from '../schemas/comment.schema';
import { ReplyDocument } from '../schemas/reply.schema';
import { GroupDocument } from '../../groups/schemas/group.schema';

export interface PolicyUser {
  id: string;
  role: UserRole;
}

export class CommentPolicy {
  static canEditComment(user: PolicyUser, comment: CommentDocument): boolean {
    return comment.authorId.toString() === user.id;
  }

  static canDeleteComment(
    user: PolicyUser,
    comment: CommentDocument,
    group: GroupDocument,
  ): boolean {
    if (user.role === UserRole.ADMIN) return true;
    if (comment.authorId.toString() === user.id) return true;
    if (group.hostId.toString() === user.id) return true;
    return false;
  }

  static canReply(user: PolicyUser, group: GroupDocument): boolean {
    if (user.role === UserRole.ADMIN) return true;
    return group.hostId.toString() === user.id;
  }

  static canEditReply(user: PolicyUser, reply: ReplyDocument): boolean {
    return reply.authorId.toString() === user.id;
  }

  static canDeleteReply(
    user: PolicyUser,
    reply: ReplyDocument,
    group: GroupDocument,
  ): boolean {
    if (user.role === UserRole.ADMIN) return true;
    if (reply.authorId.toString() === user.id) return true;
    if (group.hostId.toString() === user.id) return true;
    return false;
  }
}
