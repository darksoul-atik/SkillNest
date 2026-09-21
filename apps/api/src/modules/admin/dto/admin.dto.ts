import { createZodDto } from 'nestjs-zod';
import { updateUserRoleSchema, updateUserStatusSchema, cursorPaginationQuerySchema } from '@skillnest/shared';

export class UpdateUserRoleDto extends createZodDto(updateUserRoleSchema) {}
export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}
export class CursorPaginationQueryDto extends createZodDto(cursorPaginationQuerySchema) {}
