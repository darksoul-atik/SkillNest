import { MembershipDocument } from '../schemas/membership.schema';
import { MembershipResponse } from '@skillnest/shared';
import { UserDocument } from '../../users/schemas/user.schema';

export class MembershipMapper {
  static toResponse(
    membership: MembershipDocument & { userId: UserDocument | any },
  ): MembershipResponse {
    const userDoc = membership.userId as UserDocument;
    const isPopulated = userDoc && typeof userDoc === 'object' && '_id' in userDoc;

    const userId = isPopulated ? userDoc._id.toString() : membership.userId.toString();
    const avatarId = isPopulated && userDoc.avatarMediaId ? userDoc.avatarMediaId.toString() : null;

    return {
      id: membership._id.toString(),
      groupId: membership.groupId.toString(),
      userId,
      user: {
        id: userId,
        name: isPopulated ? userDoc.name : 'Unknown User',
        email: isPopulated ? userDoc.email : '',
        avatarUrl: avatarId ? `/api/v1/media/${avatarId}` : null,
        avatarThumbUrl: avatarId ? `/api/v1/media/${avatarId}/thumb` : null,
      },
      role: membership.role,
      joinedAt: membership.joinedAt ? membership.joinedAt.toISOString() : new Date().toISOString(),
    };
  }
}
