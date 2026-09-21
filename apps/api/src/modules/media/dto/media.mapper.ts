import { MediaDocument } from '../schemas/media.schema';
import { MediaResponse } from '@skillnest/shared';

export class MediaMapper {
  static toResponse(media: MediaDocument): MediaResponse {
    const id = media._id.toString();
    return {
      id,
      url: `/api/v1/media/${id}`,
      thumbUrl: `/api/v1/media/${id}/thumb`,
      purpose: media.purpose,
      originalName: media.originalName,
      mime: media.mime,
      size: media.size,
      width: media.width,
      height: media.height,
      createdAt: media.createdAt.toISOString(),
    };
  }
}
