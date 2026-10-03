import { prisma } from "db";
import { ApiError } from "../../utils/api_exception.ts";
import { sendResponse } from "../../utils/send_response.ts";
import { ApiResponse } from "../../utils/api_response.ts";
import { asyncHandler } from "../../utils/asynchandler.ts";
import type { Request, Response } from "express";
import type {
  AddMemberSchema,
  CreateOrgSchema,
  GetAllOrgSchema,
  MemberParamSchema,
  OrgParamSchema,
  UpdateMemberRoleSchema,
} from "./organization_schema.ts";
import { Role } from "db/generated";

export const createOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body as CreateOrgSchema;
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: data,
      });

      await tx.membership.create({
        data: {
          userId: userId,
          orgId: org.id,
          role: Role.ADMIN,
        },
      });

      return org;
    });

    return sendResponse(
      res,
      ApiResponse.created({
        data: organization,
        message: "Organization created successfully",
      }),
    );
  },
);

export const updateOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: orgId } = req.params as OrgParamSchema;
    const data = req.body as CreateOrgSchema;
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: orgId,
      },
    });

    if (!membership) {
      throw ApiError.notFound("Membership not found");
    }

    if (membership.role !== Role.ADMIN) {
      throw ApiError.forbidden(
        "You are not authorized to update this organization",
      );
    }

    const updatedOrganization = await prisma.organization.update({
      where: {
        id: orgId,
      },
      data: data,
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: updatedOrganization,
        message: "Organization updated successfully",
      }),
    );
  },
);

export const getAllOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const { membershipStatus } = req.query as GetAllOrgSchema;

    const organizations = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: userId,
            ...(membershipStatus && { role: membershipStatus }),
          },
        },
      },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: organizations,
        message: "Organizations fetched successfully",
      }),
    );
  },
);

export const deleteOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: orgId } = req.params as OrgParamSchema;
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: orgId,
      },
    });

    if (!membership) {
      throw ApiError.notFound("Organization not found or you are not a member");
    }

    if (membership.role !== Role.ADMIN) {
      throw ApiError.forbidden(
        "You are not authorized to delete this organization",
      );
    }

    await prisma.organization.delete({
      where: {
        id: orgId,
      },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: null,
        message: "Organization deleted successfully",
      }),
    );
  },
);

export const getOrganizationMembers = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: orgId } = req.params as OrgParamSchema;
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: orgId,
      },
    });

    if (!membership) {
      throw ApiError.notFound("Organization not found or you are not a member");
    }

    const members = await prisma.membership.findMany({
      where: {
        orgId: orgId,
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: members,
        message: "Organization members fetched successfully",
      }),
    );
  },
);

export const addOrganizationMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: orgId } = req.params as OrgParamSchema;
    const { email, role } = req.body as AddMemberSchema;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const requesterMembership = await prisma.membership.findFirst({
      where: {
        userId: currentUserId,
        orgId: orgId,
      },
    });

    if (!requesterMembership) {
      throw ApiError.notFound("Organization not found or you are not a member");
    }

    if (requesterMembership.role !== Role.ADMIN) {
      throw ApiError.forbidden(
        "You are not authorized to add members to this organization",
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!targetUser) {
      throw ApiError.notFound("User with this email does not exist");
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: targetUser.id,
          orgId: orgId,
        },
      },
    });

    if (existingMembership) {
      throw ApiError.conflict("User is already a member of this organization");
    }

    const newMember = await prisma.membership.create({
      data: {
        userId: targetUser.id,
        orgId: orgId,
        role: (role as Role) ?? Role.MEMBER,
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sendResponse(
      res,
      ApiResponse.created({
        data: newMember,
        message: "Member added to organization successfully",
      }),
    );
  },
);

export const updateMemberRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: orgId, userId: targetUserId } =
      req.params as unknown as MemberParamSchema;
    const { role } = req.body as UpdateMemberRoleSchema;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const requesterMembership = await prisma.membership.findFirst({
      where: {
        userId: currentUserId,
        orgId: orgId,
      },
    });

    if (!requesterMembership) {
      throw ApiError.notFound("Organization not found or you are not a member");
    }

    if (requesterMembership.role !== Role.ADMIN) {
      throw ApiError.forbidden(
        "You are not authorized to update member roles in this organization",
      );
    }

    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: targetUserId,
          orgId: orgId,
        },
      },
    });

    if (!targetMembership) {
      throw ApiError.notFound("Member not found in this organization");
    }

  
    if (targetUserId === currentUserId && role !== Role.ADMIN) {
      const adminCount = await prisma.membership.count({
        where: {
          orgId: orgId,
          role: Role.ADMIN,
        },
      });

      if (adminCount <= 1) {
        throw ApiError.badRequest(
          "Cannot demote yourself. You are the only admin in this organization.",
        );
      }
    }

    const updatedMember = await prisma.membership.update({
      where: {
        userId_orgId: {
          userId: targetUserId,
          orgId: orgId,
        },
      },
      data: {
        role: role as Role,
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: updatedMember,
        message: "Member role updated successfully",
      }),
    );
  },
);

export const removeOrganizationMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: orgId, userId: targetUserId } =
      req.params as unknown as MemberParamSchema;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const requesterMembership = await prisma.membership.findFirst({
      where: {
        userId: currentUserId,
        orgId: orgId,
      },
    });

    if (!requesterMembership) {
      throw ApiError.notFound("Organization not found or you are not a member");
    }

    if (requesterMembership.role !== Role.ADMIN) {
      throw ApiError.forbidden(
        "You are not authorized to remove members from this organization",
      );
    }

    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: targetUserId,
          orgId: orgId,
        },
      },
    });

    if (!targetMembership) {
      throw ApiError.notFound("Member not found in this organization");
    }

    if (targetUserId === currentUserId) {
      const adminCount = await prisma.membership.count({
        where: {
          orgId: orgId,
          role: Role.ADMIN,
        },
      });

      if (adminCount <= 1) {
        throw ApiError.badRequest(
          "Cannot remove yourself as you are the only admin. Transfer admin role first or delete the organization.",
        );
      }
    }

    await prisma.membership.delete({
      where: {
        userId_orgId: {
          userId: targetUserId,
          orgId: orgId,
        },
      },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: null,
        message: "Member removed from organization successfully",
      }),
    );
  },
);

export const leaveOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: orgId } = req.params as OrgParamSchema;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: currentUserId,
          orgId: orgId,
        },
      },
    });

    if (!membership) {
      throw ApiError.notFound("You are not a member of this organization");
    }

    if (membership.role === Role.ADMIN) {
      const adminCount = await prisma.membership.count({
        where: {
          orgId: orgId,
          role: Role.ADMIN,
        },
      });

      if (adminCount <= 1) {
        throw ApiError.badRequest(
          "You are the only admin in this organization. Promote another member to admin before leaving, or delete the organization.",
        );
      }
    }

    await prisma.membership.delete({
      where: {
        userId_orgId: {
          userId: currentUserId,
          orgId: orgId,
        },
      },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: null,
        message: "You have left the organization successfully",
      }),
    );
  },
);