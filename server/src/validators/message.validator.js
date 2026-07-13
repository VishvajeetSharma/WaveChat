import { z } from "zod";

export const getConversationSchema = {
  params: z.object({
    userId: z.coerce.number().int().positive(),
  }),
  query: z.object({
    before: z.string().datetime().optional().or(z.literal("")).transform((v) => v || undefined),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
};
