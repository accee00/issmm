export type ApiResponseOptions<T = unknown> = {
  statusCode: number;
  data?: T | null;
  message?: string;
};

export type ApiResponseBody<T = unknown> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
};

export class ApiResponse<T = unknown> {
  readonly statusCode: number;
  readonly data: T | null;
  readonly message: string;
  readonly success: boolean;

  constructor({
    statusCode,
    data = null,
    message = "Success",
  }: ApiResponseOptions<T>) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  toJSON(): ApiResponseBody<T> {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    };
  }

  static ok<T>({ data, message = "Success" }: { data: T; message?: string }) {
    return new ApiResponse({
      statusCode: 200,
      data,
      message,
    });
  }

  static created<T>({
    data,
    message = "Created",
  }: {
    data: T;
    message?: string;
  }) {
    return new ApiResponse({
      statusCode: 201,
      data,
      message,
    });
  }
}
