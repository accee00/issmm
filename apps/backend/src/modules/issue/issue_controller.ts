import { prisma } from "db";
import { ApiError } from "../../utils/api_exception.ts";
import { sendResponse } from "../../utils/send_response.ts";
import { ApiResponse } from "../../utils/api_response.ts";
import { asyncHandler } from "../../utils/asynchandler.ts";
import type { Request, Response } from "express";
import { Role } from "db/generated";
import type {
  CreateIssueSchema,
  GetIssuesQuerySchema,
  IssueParamSchema,
  MoveIssueSchema,
  UpdateIssueSchema,
} from "./issue_schema.ts";

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const data = req.body as CreateIssueSchema;

  if (!userId) {
    throw ApiError.unauthorized("Authentication required");
  }
  const section = await prisma.section.findUnique({
    where: { id: data.sectionId },
    include: {
      board: {
        select: {
          id: true,
          orgId: true,
        },
      },
    },
  });

  if (!section) {
    throw ApiError.notFound("Section not found");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: userId,
      orgId: section.board.orgId,
    },
  });

  if (!membership) {
    throw ApiError.forbidden("You do not have access to this board's organization");
  }

  if (data.assigneeId) {
    const assigneeMembership = await prisma.membership.findFirst({
      where: {
        userId: data.assigneeId,
        orgId: section.board.orgId,
      },
    });

    if (!assigneeMembership) {
      throw ApiError.badRequest("Assignee must be a member of this organization");
    }
  }

  let order = data.order;
  if (order === undefined) {
    const lastIssue = await prisma.issue.findFirst({
      where: { sectionId: data.sectionId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    order = lastIssue ? lastIssue.order + 1 : 0;
  }

  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: data.description,
      order: order,
      sectionId: data.sectionId,
      creatorId: userId,
      assigneeId: data.assigneeId ?? null,
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
      section: {
        select: { id: true, name: true, boardId: true },
      },
    },
  });

  return sendResponse(
    res,
    ApiResponse.created({
      data: issue,
      message: "Issue created successfully",
    }),
  );
});

export const getIssueById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id: issueId } = req.params as IssueParamSchema;

  if (!userId) {
    throw ApiError.unauthorized("Authentication required");
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      section: {
        include: {
          board: {
            select: { id: true, name: true, orgId: true },
          },
        },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!issue) {
    throw ApiError.notFound("Issue not found");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: userId,
      orgId: issue.section.board.orgId,
    },
  });

  if (!membership) {
    throw ApiError.forbidden("You do not have access to this issue");
  }

  return sendResponse(
    res,
    ApiResponse.ok({
      data: issue,
      message: "Issue fetched successfully",
    }),
  );
});

export const getIssues = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { boardId, sectionId, assignedToMe } =
    req.query as unknown as GetIssuesQuerySchema;

  if (!userId) {
    throw ApiError.unauthorized("Authentication required");
  }

  if (boardId) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { orgId: true },
    });

    if (!board) {
      throw ApiError.notFound("Board not found");
    }

    const membership = await prisma.membership.findFirst({
      where: { userId, orgId: board.orgId },
    });

    if (!membership) {
      throw ApiError.forbidden("You do not have access to this board");
    }
  }

  if (sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { board: { select: { orgId: true } } },
    });

    if (!section) {
      throw ApiError.notFound("Section not found");
    }

    const membership = await prisma.membership.findFirst({
      where: { userId, orgId: section.board.orgId },
    });

    if (!membership) {
      throw ApiError.forbidden("You do not have access to this section");
    }
  }

  const issues = await prisma.issue.findMany({
    where: {
      ...(sectionId && { sectionId }),
      ...(boardId && { section: { boardId } }),
      ...(assignedToMe && { assigneeId: userId }),
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
      section: {
        select: { id: true, name: true, boardId: true },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return sendResponse(
    res,
    ApiResponse.ok({
      data: issues,
      message: "Issues fetched successfully",
    }),
  );
});

export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id: issueId } = req.params as IssueParamSchema;
  const data = req.body as UpdateIssueSchema;

  if (!userId) {
    throw ApiError.unauthorized("Authentication required");
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      section: {
        include: {
          board: {
            select: { orgId: true },
          },
        },
      },
    },
  });

  if (!issue) {
    throw ApiError.notFound("Issue not found");
  }

  const orgId = issue.section.board.orgId;

  const membership = await prisma.membership.findFirst({
    where: { userId, orgId },
  });

  if (!membership) {
    throw ApiError.forbidden("You do not have access to this issue");
  }

  if (data.assigneeId !== undefined && data.assigneeId !== null) {
    const assigneeMembership = await prisma.membership.findFirst({
      where: {
        userId: data.assigneeId,
        orgId,
      },
    });

    if (!assigneeMembership) {
      throw ApiError.badRequest("Assignee must be a member of this organization");
    }
  }

  const updatedIssue = await prisma.issue.update({
    where: { id: issueId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
      section: {
        select: { id: true, name: true, boardId: true },
      },
    },
  });

  return sendResponse(
    res,
    ApiResponse.ok({
      data: updatedIssue,
      message: "Issue updated successfully",
    }),
  );
});

export const moveIssue = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id: issueId } = req.params as IssueParamSchema;
  const { targetSectionId, order } = req.body as MoveIssueSchema;

  if (!userId) {
    throw ApiError.unauthorized("Authentication required");
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      section: {
        include: {
          board: {
            select: { id: true, orgId: true },
          },
        },
      },
    },
  });

  if (!issue) {
    throw ApiError.notFound("Issue not found");
  }

  const currentBoard = issue.section.board;

  const membership = await prisma.membership.findFirst({
    where: { userId, orgId: currentBoard.orgId },
  });

  if (!membership) {
    throw ApiError.forbidden("You do not have access to this board");
  }

  let newSectionId = issue.sectionId;

  if (targetSectionId && targetSectionId !== issue.sectionId) {
    const targetSection = await prisma.section.findUnique({
      where: { id: targetSectionId },
      select: { boardId: true },
    });

    if (!targetSection) {
      throw ApiError.notFound("Target section not found");
    }

    if (targetSection.boardId !== currentBoard.id) {
      throw ApiError.badRequest(
        "Cannot move issue across different boards",
      );
    }

    newSectionId = targetSectionId;
  }

  const updatedIssue = await prisma.issue.update({
    where: { id: issueId },
    data: {
      sectionId: newSectionId,
      order: order,
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
      section: {
        select: { id: true, name: true, boardId: true },
      },
    },
  });

  return sendResponse(
    res,
    ApiResponse.ok({
      data: updatedIssue,
      message: "Issue moved successfully",
    }),
  );
});

export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id: issueId } = req.params as IssueParamSchema;

  if (!userId) {
    throw ApiError.unauthorized("Authentication required");
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      section: {
        include: {
          board: {
            select: { orgId: true },
          },
        },
      },
    },
  });

  if (!issue) {
    throw ApiError.notFound("Issue not found");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      orgId: issue.section.board.orgId,
    },
  });

  if (!membership) {
    throw ApiError.forbidden("You do not have access to this issue");
  }

  if (
    issue.creatorId !== userId &&
    membership.role !== Role.OWNER &&
    membership.role !== Role.ADMIN
  ) {
    throw ApiError.forbidden(
      "Only the creator or organization administrators can delete this issue",
    );
  }

  await prisma.issue.delete({
    where: { id: issueId },
  });

  return sendResponse(
    res,
    ApiResponse.ok({
      data: null,
      message: "Issue deleted successfully",
    }),
  );
});
