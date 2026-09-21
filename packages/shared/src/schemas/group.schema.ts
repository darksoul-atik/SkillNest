import { z } from 'zod';
import { GROUP_CATEGORIES } from '../enums/group-category.enum.js';
import { GROUP_STATUSES } from '../enums/group-status.enum.js';

export const createGroupSchema = z.object({
  name: z.string().trim().min(3, 'Group name must be at least 3 characters').max(100),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.enum(GROUP_CATEGORIES),
  location: z.string().trim().min(2, 'Location is required').max(100),
  coverMediaId: z.string().nullable().optional(),
  maxMembers: z.coerce.number().int().min(2, 'Must allow at least 2 members').max(1000),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO start date string',
  }),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = createGroupSchema.partial();

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const groupAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  avatarThumbUrl: z.string().nullable().optional(),
});
export type GroupAuthor = z.infer<typeof groupAuthorSchema>;


export const groupResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(GROUP_CATEGORIES),
  location: z.string(),
  coverMediaId: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  coverThumbUrl: z.string().nullable().optional(),
  maxMembers: z.number().int(),
  memberCount: z.number().int(),
  startDate: z.string(),
  hostId: z.string(),
  host: groupAuthorSchema,
  status: z.enum(GROUP_STATUSES),
  isHost: z.boolean().optional(),
  isMember: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GroupResponse = z.infer<typeof groupResponseSchema>;
