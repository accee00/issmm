import { z } from "zod";

export const createBoardSchema = z.object({
  orgId: z.string({ error: "Organization ID is required" }),
  name: z
    .string({ error: "Board name is required" })
    .min(2, { message: "Board name must be at least 2 characters long" }),
  description: z.string().optional(),
  sections: z
    .array(z.string().min(1, { message: "Section name cannot be empty" }))
    .optional(),
});

export const getBoardsQuerySchema = z.object({
  orgId: z.string({ error: "orgId query parameter is required" }),
});

export const updateBoardSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Board name must be at least 2 characters long" })
    .optional(),
  description: z.string().optional(),
});

export const boardParamSchema = z.object({
  id: z.string({ error: "Board ID is required" }),
});

export const boardOnlyParamSchema = z.object({
  boardId: z.string({ error: "Board ID is required" }),
});

export const createSectionSchema = z.object({
  name: z
    .string({ error: "Section name is required" })
    .min(1, { message: "Section name cannot be empty" }),
  order: z.number().int().optional(),
});

export const updateSectionSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Section name cannot be empty" })
    .optional(),
  order: z.number().int().optional(),
});

export const boardSectionParamSchema = z.object({
  boardId: z.string({ error: "Board ID is required" }),
  sectionId: z.string({ error: "Section ID is required" }),
});

export const reorderSectionsSchema = z.object({
  sectionIds: z
    .array(z.string(), { error: "sectionIds array is required" })
    .min(1, { message: "At least one section ID must be provided" }),
});

export type CreateBoardSchema = z.infer<typeof createBoardSchema>;
export type GetBoardsQuerySchema = z.infer<typeof getBoardsQuerySchema>;
export type UpdateBoardSchema = z.infer<typeof updateBoardSchema>;
export type BoardParamSchema = z.infer<typeof boardParamSchema>;
export type BoardOnlyParamSchema = z.infer<typeof boardOnlyParamSchema>;
export type CreateSectionSchema = z.infer<typeof createSectionSchema>;
export type UpdateSectionSchema = z.infer<typeof updateSectionSchema>;
export type BoardSectionParamSchema = z.infer<typeof boardSectionParamSchema>;
export type ReorderSectionsSchema = z.infer<typeof reorderSectionsSchema>;
