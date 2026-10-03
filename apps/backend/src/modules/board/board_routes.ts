import { Router } from "express";
import { authMiddleware } from "../../middleware/middleware.ts";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/zod_validation_middleware.ts";
import {
  createBoard,
  createSection,
  deleteBoard,
  deleteSection,
  getBoardById,
  getOrganizationBoards,
  reorderSections,
  updateBoard,
  updateSection,
} from "./board_controller.ts";
import {
  boardOnlyParamSchema,
  boardParamSchema,
  boardSectionParamSchema,
  createBoardSchema,
  createSectionSchema,
  getBoardsQuerySchema,
  reorderSectionsSchema,
  updateBoardSchema,
  updateSectionSchema,
} from "./board_schema.ts";

const router = Router();

router.use(authMiddleware);


router.post("/", validateBody(createBoardSchema), createBoard);
router.get("/", validateQuery(getBoardsQuerySchema), getOrganizationBoards);
router.get("/:id", validateParams(boardParamSchema), getBoardById);
router.patch(
  "/:id",
  validateParams(boardParamSchema),
  validateBody(updateBoardSchema),
  updateBoard,
);
router.delete("/:id", validateParams(boardParamSchema), deleteBoard);

router.post(
  "/:boardId/sections",
  validateParams(boardOnlyParamSchema),
  validateBody(createSectionSchema),
  createSection,
);
router.put(
  "/:boardId/sections/reorder",
  validateParams(boardOnlyParamSchema),
  validateBody(reorderSectionsSchema),
  reorderSections,
);
router.patch(
  "/:boardId/sections/:sectionId",
  validateParams(boardSectionParamSchema),
  validateBody(updateSectionSchema),
  updateSection,
);
router.delete(
  "/:boardId/sections/:sectionId",
  validateParams(boardSectionParamSchema),
  deleteSection,
);

export default router;
