import { Router } from "express";
import { authMiddleware } from "../../middleware/middleware.ts";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/zod_validation_middleware.ts";
import {
  addOrganizationMember,
  createOrganization,
  deleteOrganization,
  getAllOrganization,
  getOrganizationMembers,
  leaveOrganization,
  removeOrganizationMember,
  updateMemberRole,
  updateOrganization,
} from "./organization_controller.ts";
import {
  addMemberSchema,
  createOrgSchema,
  getAllOrgSchema,
  memberParamSchema,
  orgParamSchema,
  updateMemberRoleSchema,
  updateOrgSchema,
} from "./organization_schema.ts";

const router = Router();

router.use(authMiddleware);

router.post("/", validateBody(createOrgSchema), createOrganization);
router.get("/", validateQuery(getAllOrgSchema), getAllOrganization);
router.patch(
  "/:id",
  validateParams(orgParamSchema),
  validateBody(updateOrgSchema),
  updateOrganization,
);
router.delete("/:id", validateParams(orgParamSchema), deleteOrganization);

router.get("/:id/members", validateParams(orgParamSchema), getOrganizationMembers);
router.post(
  "/:id/members",
  validateParams(orgParamSchema),
  validateBody(addMemberSchema),
  addOrganizationMember,
);
router.patch(
  "/:id/members/:userId",
  validateParams(memberParamSchema),
  validateBody(updateMemberRoleSchema),
  updateMemberRole,
);
router.delete(
  "/:id/members/:userId",
  validateParams(memberParamSchema),
  removeOrganizationMember,
);

// Leave Organization
router.post("/:id/leave", validateParams(orgParamSchema), leaveOrganization);

export default router;
