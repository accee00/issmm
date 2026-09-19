import { asyncHandler } from "../../utils/asynchandler.ts";
import {
  type Request,
  type Response,
  type NextFunction,
  response,
} from "express";
import type { RefreshSessionSchema, SignInSchema, SignUpSchema } from "./auth_schema.ts";
import { prisma } from "db";
import { ApiError } from "../../utils/api_exception.ts";
import { generateTokens } from "../../utils/jwt.ts";
import { sendResponse } from "../../utils/send_response.ts";
import { ApiResponse } from "../../utils/api_response.ts";
import { sha256 } from "../../utils/hash_fn.ts";

const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

async function createSession(userId: string, refreshToken: string) {
  await prisma.refreshToken.create({
    data: {
      userId: userId,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    },
  });
}

export const signUpUserWithEmailAndPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body as SignUpSchema;
    const doesUserExist = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (doesUserExist) {
      throw ApiError.conflict("User already exists!");
    }
    const hashedPassword = await Bun.password.hash(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    const { accessToken, refreshToken } = await generateTokens(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      {
        id: user.id,
      },
    );
    await createSession(user.id, refreshToken);

    return sendResponse(
      res,
      ApiResponse.created({
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        message: "User created successfully!",
      }),
    );
  },
);

export const signInUserWithEmailAndPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const data = req.body as SignInSchema;
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found!");
    }

    const isPasswordValid = await Bun.password.verify(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid password!");
    }

    const { accessToken, refreshToken } = await generateTokens(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      {
        id: user.id,
      },
    );
    await createSession(user.id, refreshToken);

    return sendResponse(
      res,
      ApiResponse.ok({
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        message: "User signed in successfully!",
      }),
    );
  },
);
export const refreshSession = asyncHandler(
  async (req: Request, res: Response) => {
  }
);