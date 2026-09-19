import { z } from "zod";

export const createOrgSchema = z.object({
  name: z
    .string({ error: "Name of org is required" })
    .min(4, { message: "Name of org must be at least 4 characters long" }),
  description: z.string({ error: "Description of org is required" }).optional(),
});

export const updateOrgSchema = z.object({
  name: z
    .string({ error: "Name of org is required" })
    .min(4, { message: "Name of org must be at least 4 characters long" })
    .optional(),
  description: z.string({ error: "Description of org is required" }).optional(),
});

export type createOrgInput = z.infer<typeof createOrgSchema>;
export type updateOrgInput = z.infer<typeof updateOrgSchema>;
