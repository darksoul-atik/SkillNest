import { createZodDto } from 'nestjs-zod';
import { uploadMediaDtoSchema } from '@skillnest/shared';

export class UploadMediaDto extends createZodDto(uploadMediaDtoSchema) {}
