import { z } from "zod";

export const createIssueSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .min(1, { message: "Title cannot be empty" })
    .max(255, { message: "Title must be less than 255 characters" }),
  description: z.string().optional().nullable(),
  sectionId: z.string({ error: "Section ID is required" }),
  assigneeId: z.string().optional().nullable(),
  order: z.number().int().optional(),
});

export const updateIssueSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title cannot be empty" })
    .max(255, { message: "Title must be less than 255 characters" })
    .optional(),
  description: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const moveIssueSchema = z.object({
  targetSectionId: z.string().optional(),
  order: z.number().int({ message: "Order must be an integer" }),
});

export const getIssuesQuerySchema = z.object({
  sectionId: z.string().optional(),
  boardId: z.string().optional(),
  assignedToMe: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export const issueParamSchema = z.object({
  id: z.string({ error: "Issue ID is required" }),
});

export type CreateIssueSchema = z.infer<typeof createIssueSchema>;
export type UpdateIssueSchema = z.infer<typeof updateIssueSchema>;
export type MoveIssueSchema = z.infer<typeof moveIssueSchema>;
export type GetIssuesQuerySchema = z.infer<typeof getIssuesQuerySchema>;
export type IssueParamSchema = z.infer<typeof issueParamSchema>;
