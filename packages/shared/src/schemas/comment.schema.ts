import { z } from 'zod';
import { replyResponseSchema } from './reply.schema.js';

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(1000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = createCommentSchema;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export const commentAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  avatarThumbUrl: z.string().nullable().optional(),
  roleBadge: z.string().optional(),
});
export type CommentAuthor = z.infer<typeof commentAuthorSchema>;


export const commentResponseSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  authorId: z.string(),
  author: commentAuthorSchema,
  body: z.string(),
  editedAt: z.string().nullable().optional(),
  replyCount: z.number().int(),
  repliesPreview: z.array(replyResponseSchema).default([]),
  isAuthor: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  createdAt: z.string(),
});

export type CommentResponse = z.infer<typeof commentResponseSchema>;
