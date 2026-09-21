import { z } from 'zod';

export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(['new', 'soon', 'popular']).optional().default('new'),
  category: z.string().optional(),
  q: z.string().optional(),
  hostId: z.string().optional(),
  joinable: z.coerce.boolean().optional(),
  role: z.enum(['hosted', 'joined']).optional(),
});

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

export const cursorPaginationMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  limit: z.number().int(),
  total: z.number().int().optional(),
});

export type CursorPaginationMeta = z.infer<typeof cursorPaginationMetaSchema>;
