import { z } from 'zod';
import { MediaPurpose, MEDIA_PURPOSES } from '../enums/media-purpose.enum.js';

export const mediaResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  thumbUrl: z.string(),
  purpose: z.enum(MEDIA_PURPOSES),
  originalName: z.string(),
  mime: z.string(),
  size: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
  createdAt: z.string(),
});

export type MediaResponse = z.infer<typeof mediaResponseSchema>;

export const uploadMediaDtoSchema = z.object({
  purpose: z.nativeEnum(MediaPurpose).default(MediaPurpose.GROUP_COVER),
});

export type UploadMediaInput = z.infer<typeof uploadMediaDtoSchema>;
