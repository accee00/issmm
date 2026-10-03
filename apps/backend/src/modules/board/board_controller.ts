import { prisma } from "db";
import { ApiError } from "../../utils/api_exception.ts";
import { sendResponse } from "../../utils/send_response.ts";
import { ApiResponse } from "../../utils/api_response.ts";
import { asyncHandler } from "../../utils/asynchandler.ts";
import type { Request, Response } from "express";
import { Role } from "db/generated";
import type {
  BoardOnlyParamSchema,
  BoardParamSchema,
  BoardSectionParamSchema,
  CreateBoardSchema,
  CreateSectionSchema,
  GetBoardsQuerySchema,
  ReorderSectionsSchema,
  UpdateBoardSchema,
  UpdateSectionSchema,
} from "./board_schema.ts";

export const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const data = req.body as CreateBoardSchema;

  if (!userId) {
    throw ApiError.unauthorized("Authentication required");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: userId,
      orgId: data.orgId,
    },
  });

  if (!membership) {
    throw ApiError.notFound("Organization not found or you are not a member");
  }

  if (membership.role !== Role.OWNER && membership.role !== Role.ADMIN) {
    throw ApiError.forbidden(
      "Only organization owners and admins can create boards",
    );
  }

  const initialSections =
    data.sections && data.sections.length > 0
      ? data.sections
      : ["To Do", "In Progress", "Done"];

  const board = await prisma.$transaction(async (tx) => {
    const createdBoard = await tx.board.create({
      data: {
        name: data.name,
        description: data.description,
        orgId: data.orgId,
      },
    });

    await tx.section.createMany({
      data: initialSections.map((sectionName, index) => ({
        name: sectionName,
        order: index,
        boardId: createdBoard.id,
      })),
    });

    return tx.board.findUnique({
      where: { id: createdBoard.id },
      include: {
        sections: {
          orderBy: { order: "asc" },
        },
      },
    });
  });

  return sendResponse(
    res,
    ApiResponse.created({
      data: board,
      message: "Board created successfully with dynamic sections",
    }),
  );
});

export const getOrganizationBoards = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { orgId } = req.query as unknown as GetBoardsQuerySchema;

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

    const boards = await prisma.board.findMany({
      where: {
        orgId: orgId,
      },
      include: {
        _count: {
          select: {
            sections: true,
          },
        },
        sections: {
          select: {
            id: true,
            name: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: boards,
        message: "Boards fetched successfully",
      }),
    );
  },
);

export const getBoardById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id: boardId } = req.params as BoardParamSchema;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            issues: {
              orderBy: { order: "asc" },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true },
                },
                creator: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw ApiError.notFound("Board not found");
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: board.orgId,
      },
    });

    if (!membership) {
      throw ApiError.forbidden("You do not have access to this board");
    }

    return sendResponse(
      res,
      ApiResponse.ok({
        data: board,
        message: "Board fetched successfully",
      }),
    );
  },
);

export const updateBoard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id: boardId } = req.params as BoardParamSchema;
  const data = req.body as UpdateBoardSchema;

  if (!userId) {
    throw ApiError.unauthorized("Authentication required");
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board) {
    throw ApiError.notFound("Board not found");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: userId,
      orgId: board.orgId,
    },
  });

  if (!membership) {
    throw ApiError.forbidden("You do not have access to this board");
  }

  if (membership.role !== Role.OWNER && membership.role !== Role.ADMIN) {
    throw ApiError.forbidden(
      "Only organization owners and admins can update boards",
    );
  }

  const updatedBoard = await prisma.board.update({
    where: { id: boardId },
    data: {
      name: data.name,
      description: data.description,
    },
  });

  return sendResponse(
    res,
    ApiResponse.ok({
      data: updatedBoard,
      message: "Board updated successfully",
    }),
  );
});

export const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id: boardId } = req.params as BoardParamSchema;

  if (!userId) {
    throw ApiError.unauthorized("Authentication required");
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board) {
    throw ApiError.notFound("Board not found");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: userId,
      orgId: board.orgId,
    },
  });

  if (!membership) {
    throw ApiError.forbidden("You do not have access to this board");
  }

  if (membership.role !== Role.OWNER && membership.role !== Role.ADMIN) {
    throw ApiError.forbidden(
      "Only organization owners and admins can delete boards",
    );
  }

  await prisma.board.delete({
    where: { id: boardId },
  });

  return sendResponse(
    res,
    ApiResponse.ok({
      data: null,
      message: "Board deleted successfully",
    }),
  );
});

export const createSection = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { boardId } = req.params as BoardOnlyParamSchema;
    const data = req.body as CreateSectionSchema;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw ApiError.notFound("Board not found");
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: board.orgId,
      },
    });

    if (!membership) {
      throw ApiError.forbidden("You do not have access to this board");
    }

    if (membership.role !== Role.OWNER && membership.role !== Role.ADMIN) {
      throw ApiError.forbidden(
        "Only organization owners and admins can create sections",
      );
    }

    let order = data.order;
    if (order === undefined) {
      const lastSection = await prisma.section.findFirst({
        where: { boardId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = lastSection ? lastSection.order + 1 : 0;
    }

    const section = await prisma.section.create({
      data: {
        name: data.name,
        order: order,
        boardId: boardId,
      },
    });

    return sendResponse(
      res,
      ApiResponse.created({
        data: section,
        message: "Section created successfully",
      }),
    );
  },
);

export const updateSection = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { boardId, sectionId } = req.params as BoardSectionParamSchema;
    const data = req.body as UpdateSectionSchema;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw ApiError.notFound("Board not found");
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: board.orgId,
      },
    });

    if (!membership) {
      throw ApiError.forbidden("You do not have access to this board");
    }

    if (membership.role !== Role.OWNER && membership.role !== Role.ADMIN) {
      throw ApiError.forbidden(
        "Only organization owners and admins can update sections",
      );
    }

    const existingSection = await prisma.section.findFirst({
      where: {
        id: sectionId,
        boardId: boardId,
      },
    });

    if (!existingSection) {
      throw ApiError.notFound("Section not found on this board");
    }

    const updatedSection = await prisma.section.update({
      where: { id: sectionId },
      data: {
        name: data.name,
        order: data.order,
      },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: updatedSection,
        message: "Section updated successfully",
      }),
    );
  },
);

export const reorderSections = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { boardId } = req.params as BoardOnlyParamSchema;
    const { sectionIds } = req.body as ReorderSectionsSchema;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw ApiError.notFound("Board not found");
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: board.orgId,
      },
    });

    if (!membership) {
      throw ApiError.forbidden("You do not have access to this board");
    }

    if (membership.role !== Role.OWNER && membership.role !== Role.ADMIN) {
      throw ApiError.forbidden(
        "Only organization owners and admins can reorder sections",
      );
    }

    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.section.updateMany({
          where: {
            id: id,
            boardId: boardId,
          },
          data: {
            order: index,
          },
        }),
      ),
    );

    const updatedSections = await prisma.section.findMany({
      where: { boardId: boardId },
      orderBy: { order: "asc" },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: updatedSections,
        message: "Sections reordered successfully",
      }),
    );
  },
);

export const deleteSection = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { boardId, sectionId } = req.params as BoardSectionParamSchema;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw ApiError.notFound("Board not found");
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        orgId: board.orgId,
      },
    });

    if (!membership) {
      throw ApiError.forbidden("You do not have access to this board");
    }

    if (membership.role !== Role.OWNER && membership.role !== Role.ADMIN) {
      throw ApiError.forbidden(
        "Only organization owners and admins can delete sections",
      );
    }

    const existingSection = await prisma.section.findFirst({
      where: {
        id: sectionId,
        boardId: boardId,
      },
    });

    if (!existingSection) {
      throw ApiError.notFound("Section not found on this board");
    }

    await prisma.section.delete({
      where: { id: sectionId },
    });

    return sendResponse(
      res,
      ApiResponse.ok({
        data: null,
        message: "Section deleted successfully",
      }),
    );
  },
);
