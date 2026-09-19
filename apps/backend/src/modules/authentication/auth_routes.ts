import { Router } from "express";
import { validateBody } from "../../middleware/zod_validation_middleware.ts";
import { refreshSessionSchema, signInSchema, signUpSchema } from "./auth_schema.ts";
import { refreshSession, signInUserWithEmailAndPassword, signUpUserWithEmailAndPassword } from "./auth_controller.ts";

const router = Router();

router.post(
  "/signup",
  validateBody(signUpSchema),
  signUpUserWithEmailAndPassword,
);

router.post(
  "/signin",
  validateBody(signInSchema),
  signInUserWithEmailAndPassword,
);
router.post(
  "/refresh-session",
  validateBody(refreshSessionSchema),
  refreshSession,
);
export default router;
