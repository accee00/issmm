import { Router } from "express";
import { authMiddleware } from "../../middleware/middleware.ts";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/zod_validation_middleware.ts";
import {
  createIssue,
  deleteIssue,
  getIssueById,
  getIssues,
  moveIssue,
  updateIssue,
} from "./issue_controller.ts";
import {
  createIssueSchema,
  getIssuesQuerySchema,
  issueParamSchema,
  moveIssueSchema,
  updateIssueSchema,
} from "./issue_schema.ts";

const router = Router();

router.use(authMiddleware);

router.post("/", validateBody(createIssueSchema), createIssue);
router.get("/", validateQuery(getIssuesQuerySchema), getIssues);
router.get("/:id", validateParams(issueParamSchema), getIssueById);
router.patch(
  "/:id",
  validateParams(issueParamSchema),
  validateBody(updateIssueSchema),
  updateIssue,
);
router.patch(
  "/:id/move",
  validateParams(issueParamSchema),
  validateBody(moveIssueSchema),
  moveIssue,
);
router.delete("/:id", validateParams(issueParamSchema), deleteIssue);

export default router;
