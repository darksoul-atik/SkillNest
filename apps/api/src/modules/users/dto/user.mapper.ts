import { UserDocument } from '../schemas/user.schema';
import { UserResponse } from '@skillnest/shared';

export class UserMapper {
  static toResponse(user: UserDocument): UserResponse {
    const id = user._id.toString();
    const avatarMediaId = user.avatarMediaId ? user.avatarMediaId.toString() : null;

    return {
      id,
      name: user.name,
      email: user.email,
      role: user.role,
      providers: user.providers,
      avatarMediaId,
      avatarUrl: avatarMediaId ? `/api/v1/media/${avatarMediaId}` : null,
      avatarThumbUrl: avatarMediaId ? `/api/v1/media/${avatarMediaId}/thumb` : null,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
