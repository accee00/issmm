import { Router } from "express";
import { validateBody } from "../../middleware/zod_validation_middleware.ts";
import { signUpSchema } from "./auth_schema.ts";
import { signUpUserWithEmailAndPassword } from "./auth_controller.ts";

const router = Router();

router.post(
  "signup",
  validateBody(signUpSchema),
  signUpUserWithEmailAndPassword,
);

export default router;
