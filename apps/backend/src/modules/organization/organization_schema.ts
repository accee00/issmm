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

export const orgParamSchame = z.object({
  id: z.string({ error: "Id of org is required" }),
});
export const orgParamSchema = orgParamSchame;

export const getAllOrgSchema = z.object({
  membershipStatus: z
    .enum(["OWNER", "ADMIN", "MEMBER"], { error: "Invalid membership status" })
    .optional(),
});

export const addMemberSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email({ message: "Invalid email address" }),
  role: z
    .enum(["ADMIN", "MEMBER"], { error: "Role must be ADMIN or MEMBER" })
    .default("MEMBER"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], { error: "Role must be ADMIN or MEMBER" }),
});

export const memberParamSchema = z.object({
  id: z.string({ error: "Organization ID is required" }),
  userId: z.string({ error: "User ID is required" }),
});

export const transferOwnershipSchema = z.object({
  newOwnerUserId: z.string({ error: "New owner user ID is required" }),
});

export type CreateOrgSchema = z.infer<typeof createOrgSchema>;
export type UpdataOrgSchema = z.infer<typeof updateOrgSchema>;
export type OrgParamSchema = z.infer<typeof orgParamSchame>;
export type GetAllOrgSchema = z.infer<typeof getAllOrgSchema>;
export type AddMemberSchema = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleSchema = z.infer<typeof updateMemberRoleSchema>;
export type MemberParamSchema = z.infer<typeof memberParamSchema>;
export type TransferOwnershipSchema = z.infer<typeof transferOwnershipSchema>;

