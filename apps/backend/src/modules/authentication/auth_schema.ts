import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { error: "Name must be at least 3 characters." }),
  email: z
    .email({
      error: "Please enter a valid email address.",
    })
    .trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." }),
});

export const signInSchema = z.object({
  email: z
    .email({
      error: "Please enter a valid email address.",
    })
    .trim(),
  password: z.string(),
});

export type SignUpSchema = z.infer<typeof signUpSchema>;
export type SignInSchema = z.infer<typeof signInSchema>;