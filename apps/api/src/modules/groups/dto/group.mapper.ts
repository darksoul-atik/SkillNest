import { GroupDocument } from '../schemas/group.schema';
import { GroupResponse, GroupAuthor } from '@skillnest/shared';
import { UserDocument } from '../../users/schemas/user.schema';

export class GroupMapper {
  static toResponse(
    group: GroupDocument,
    host?: UserDocument | null,
    currentUserId?: string,
    isMember?: boolean,
  ): GroupResponse {
    const id = group._id.toString();
    const coverMediaId = group.coverMediaId ? group.coverMediaId.toString() : null;
    const hostId = group.hostId.toString();

    let hostAuthor: GroupAuthor;
    if (host) {
      const avatarId = host.avatarMediaId ? host.avatarMediaId.toString() : null;
      hostAuthor = {
        id: host._id.toString(),
        name: host.name,
        avatarUrl: avatarId ? `/api/v1/media/${avatarId}` : null,
        avatarThumbUrl: avatarId ? `/api/v1/media/${avatarId}/thumb` : null,
      };
    } else {
      hostAuthor = {
        id: hostId,
        name: 'SkillNest Host',
        avatarUrl: null,
        avatarThumbUrl: null,
      };
    }

    const isHost = currentUserId ? currentUserId === hostId : false;

    return {
      id,
      slug: group.slug,
      name: group.name,
      description: group.description,
      category: group.category,
      location: group.location,
      coverMediaId,
      coverUrl: coverMediaId ? `/api/v1/media/${coverMediaId}` : null,
      coverThumbUrl: coverMediaId ? `/api/v1/media/${coverMediaId}/thumb` : null,
      maxMembers: group.maxMembers,
      memberCount: group.memberCount,
      startDate: group.startDate.toISOString(),
      hostId,
      host: hostAuthor,
      status: group.status,
      isHost,
      isMember: isMember ?? isHost,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }
}
