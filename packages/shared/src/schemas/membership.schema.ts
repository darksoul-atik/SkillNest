import { z } from 'zod';
import { MEMBERSHIP_ROLES } from '../enums/membership-role.enum.js';

export const membershipUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable().optional(),
  avatarThumbUrl: z.string().nullable().optional(),
});
export type MembershipUser = z.infer<typeof membershipUserSchema>;


export const membershipResponseSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  userId: z.string(),
  user: membershipUserSchema,
  role: z.enum(MEMBERSHIP_ROLES),
  joinedAt: z.string(),
});

export type MembershipResponse = z.infer<typeof membershipResponseSchema>;
