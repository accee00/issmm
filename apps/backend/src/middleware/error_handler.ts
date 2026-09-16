import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api_exception";
import { sendError } from "../utils/send_response";


export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ApiError) {
    // logger.warn({ err }, `[ApiError] ${err.message}`);
    sendError(res, err);
    return;
  }

//   logger.error({ err }, "[Unhandled Error]");
  const message = err instanceof Error ? err.message : "Something went wrong";
  sendError(res, ApiError.internal(message));
}
