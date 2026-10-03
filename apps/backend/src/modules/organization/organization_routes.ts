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
  getOrganizationById,
  getOrganizationMembers,
  leaveOrganization,
  removeOrganizationMember,
  transferOwnership,
  updateMemberRole,
  updateOrganization,
} from "./organization_controller.ts";
import {
  addMemberSchema,
  createOrgSchema,
  getAllOrgSchema,
  memberParamSchema,
  orgParamSchema,
  transferOwnershipSchema,
  updateMemberRoleSchema,
  updateOrgSchema,
} from "./organization_schema.ts";

const router = Router();

router.use(authMiddleware);

router.post("/", validateBody(createOrgSchema), createOrganization);
router.get("/", validateQuery(getAllOrgSchema), getAllOrganization);
router.get("/:id", validateParams(orgParamSchema), getOrganizationById);
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

router.post("/:id/leave", validateParams(orgParamSchema), leaveOrganization);
router.post(
  "/:id/transfer-ownership",
  validateParams(orgParamSchema),
  validateBody(transferOwnershipSchema),
  transferOwnership,
);

export default router;
