import { createZodDto } from 'nestjs-zod';
import { createGroupSchema, updateGroupSchema } from '@skillnest/shared';

export class CreateGroupDto extends createZodDto(createGroupSchema) {}
export class UpdateGroupDto extends createZodDto(updateGroupSchema) {}
