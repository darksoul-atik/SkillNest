import { UserRole } from '@skillnest/shared';
import { GroupDocument } from '../schemas/group.schema';

export interface PolicyUser {
  id: string;
  role: UserRole;
}

export class GroupPolicy {
  static canEdit(user: PolicyUser, group: GroupDocument): boolean {
    if (user.role === UserRole.ADMIN) return true;
    return group.hostId.toString() === user.id;
  }

  static canDelete(user: PolicyUser, group: GroupDocument): boolean {
    if (user.role === UserRole.ADMIN) return true;
    return group.hostId.toString() === user.id;
  }

  static canLeave(user: PolicyUser, group: GroupDocument): boolean {
    // Host cannot leave their own group
    return group.hostId.toString() !== user.id;
  }

  static canRemoveMember(
    user: PolicyUser,
    group: GroupDocument,
    targetUserId: string,
  ): boolean {
    // Cannot remove the host via member removal endpoint
    if (group.hostId.toString() === targetUserId) {
      return false;
    }
    // Host or admin can remove members
    if (user.role === UserRole.ADMIN) return true;
    return group.hostId.toString() === user.id;
  }
}
