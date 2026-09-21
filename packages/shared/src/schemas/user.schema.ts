import { z } from 'zod';
import { UserRole, USER_ROLES } from '../enums/user-role.enum.js';
import { AUTH_PROVIDERS } from '../enums/auth-provider.enum.js';

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  providers: z.array(z.enum(AUTH_PROVIDERS)),
  avatarMediaId: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  avatarThumbUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  avatarThumbUrl: z.string().nullable().optional(),
  role: z.enum(USER_ROLES),
  hostedGroupsCount: z.number().int().default(0),
  joinedGroupsCount: z.number().int().default(0),
  createdAt: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: userResponseSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
