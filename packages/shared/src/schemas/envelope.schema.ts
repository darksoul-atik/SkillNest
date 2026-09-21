import { z } from 'zod';

export const apiErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.union([z.string(), z.array(z.string())]),
  details: z.any().optional(),
  path: z.string(),
  timestamp: z.string(),
  requestId: z.string(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export const standardMetaSchema = z.record(z.string(), z.unknown()).optional();

export function createSuccessResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: standardMetaSchema,
  });
}
