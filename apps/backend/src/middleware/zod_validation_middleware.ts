import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/api_exception.ts";

type RequestResource = "body" | "query" | "params";

type ValidationSchemas = Partial<Record<RequestResource, ZodType>>;

function assignParsedValue(
  req: Request,
  source: RequestResource,
  value: unknown,
): void {
  if (source === "body") {
    req.body = value;
    return;
  }

  if (source === "query") {
    Object.defineProperty(req, "query", {
      value,
      writable: true,
      configurable: true,
    });
    return;
  }

  req.params = value as Request["params"];
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const source of ["body", "query", "params"] as const) {
      const schemaOfSource = schemas[source];
      if (!schemaOfSource) {
        continue;
      }

      const result = schemaOfSource.safeParse(req[source]);

      if (!result.success) {
        const message = result.error.issues[0]?.message ?? "Invalid request";
        next(ApiError.badRequest(message));
        return;
      }

      assignParsedValue(req, source, result.data);
    }
    next();
  };
}

/**
 * Convenience middleware to validate `req.body`.
 *
 * Generic constraint `<T extends ZodType>`:
 * 1. Enforces at compile time that only valid Zod schemas (e.g. z.object, z.array) can be passed.
 * 2. Retains the exact schema type `T` rather than widening it to the base `ZodType`,
 *    preserving type metadata for downstream type inference.
 */
export function validateBody<T extends ZodType>(schema: T): RequestHandler {
  return validate({ body: schema });
}

export function validateQuery<T extends ZodType>(schema: T): RequestHandler {
  return validate({ query: schema });
}

export function validateParams<T extends ZodType>(schema: T): RequestHandler {
  return validate({ params: schema });
}
