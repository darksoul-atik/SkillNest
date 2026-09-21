import { createZodDto } from 'nestjs-zod';
import {
  createCommentSchema,
  updateCommentSchema,
  createReplySchema,
  updateReplySchema,
} from '@skillnest/shared';

export class CreateCommentDto extends createZodDto(createCommentSchema) {}
export class UpdateCommentDto extends createZodDto(updateCommentSchema) {}
export class CreateReplyDto extends createZodDto(createReplySchema) {}
export class UpdateReplyDto extends createZodDto(updateReplySchema) {}
