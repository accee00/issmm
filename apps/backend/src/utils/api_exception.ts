export type ApiErrorOptions = {
  statusCode: number;
  message?: string;
  stack?: string;
};

export type ApiErrorBody = {
  success: false;
  statusCode: number;
  message: string;
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly success = false as const;

  constructor({
    statusCode,
    message = "Something went wrong",
    stack = "",
  }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.message = message;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): ApiErrorBody {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
    };
  }

  static badRequest(message: string) {
    return new ApiError({ statusCode: 400, message });
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError({ statusCode: 401, message });
  }

  static forbidden(message = "Forbidden") {
    return new ApiError({ statusCode: 403, message });
  }

  static notFound(message = "Not found") {
    return new ApiError({ statusCode: 404, message });
  }

  static conflict(message = "Conflict") {
    return new ApiError({ statusCode: 409, message });
  }

  static internal(message = "Something went wrong") {
    return new ApiError({ statusCode: 500, message });
  }
}
