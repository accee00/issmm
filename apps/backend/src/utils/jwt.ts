import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { ApiError } from "./api_exception";

export interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  id: string;
}

function getSecretFromEnv(key: string): string {
  const secret = process.env[key];
  if (!secret) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return secret;
}

const ACCESS_TOKEN_SECRET = getSecretFromEnv("ACCESS_TOKEN_SECRET");
const REFRESH_TOKEN_SECRET = getSecretFromEnv("REFRESH_TOKEN_SECRET");
const ACCESS_TOKEN_EXPIRY = getSecretFromEnv("ACCESS_TOKEN_EXPIRY");
const REFRESH_TOKEN_EXPIRY = getSecretFromEnv("REFRESH_TOKEN_EXPIRY");

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function generateTokens(
  accessTokenPayload: AccessTokenPayload,
  refreshTokenPayload: RefreshTokenPayload,
) {
  const accessToken = generateAccessToken(accessTokenPayload);
  const refreshToken = generateRefreshToken(refreshTokenPayload);
  return {
    accessToken,
    refreshToken,
  };
}

function decode(token: string, secret: string) {
  try {
    return jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized("jwt expired");
    }
    throw ApiError.unauthorized("invalid token");
  }
}

export function verifyAccessToken(accessToken: string) {
  const payload = decode(accessToken, ACCESS_TOKEN_SECRET);

  if (
    typeof payload.id !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw ApiError.unauthorized("invalid token payload");
  }

  return payload as AccessTokenPayload;
}

export function verifyRefreshToken(refreshToken: string) {
  const payload = decode(refreshToken, REFRESH_TOKEN_SECRET);

  if (typeof payload.id !== "string") {
    throw ApiError.unauthorized("invalid token payload");
  }

  return payload as RefreshTokenPayload;
}
