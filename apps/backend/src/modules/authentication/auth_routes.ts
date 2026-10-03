import { Router } from "express";
import { authMiddleware } from "../../middleware/middleware.ts";
import { validateBody } from "../../middleware/zod_validation_middleware.ts";
import {
  refreshSessionSchema,
  signInSchema,
  signOutSchema,
  signUpSchema,
} from "./auth_schema.ts";
import {
  getCurrentUser,
  refreshSession,
  signInUserWithEmailAndPassword,
  signOutUser,
  signUpUserWithEmailAndPassword,
} from "./auth_controller.ts";

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

router.get("/me", authMiddleware, getCurrentUser);

router.post(
  "/signout",
  authMiddleware,
  validateBody(signOutSchema),
  signOutUser,
);

export default router;
