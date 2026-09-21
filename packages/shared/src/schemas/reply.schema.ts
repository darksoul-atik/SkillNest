import { z } from 'zod';

export const createReplySchema = z.object({
  body: z.string().trim().min(1, 'Reply body cannot be empty').max(1000),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;

export const updateReplySchema = createReplySchema;
export type UpdateReplyInput = z.infer<typeof updateReplySchema>;

export const replyAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  avatarThumbUrl: z.string().nullable().optional(),
  roleBadge: z.string().optional(),
});
export type ReplyAuthor = z.infer<typeof replyAuthorSchema>;


export const replyResponseSchema = z.object({
  id: z.string(),
  commentId: z.string(),
  groupId: z.string(),
  authorId: z.string(),
  author: replyAuthorSchema,
  body: z.string(),
  editedAt: z.string().nullable().optional(),
  isAuthor: z.boolean().optional(),
  createdAt: z.string(),
});

export type ReplyResponse = z.infer<typeof replyResponseSchema>;
