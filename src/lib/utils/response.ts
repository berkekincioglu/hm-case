import { NextResponse } from "next/server";

export class ApiResponse {
  static success<T>(data: T, message?: string, status = 200) {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
      },
      { status }
    );
  }

  static error(message: string, status = 500, errors?: unknown) {
    return NextResponse.json(
      {
        success: false,
        message,
        errors,
      },
      { status }
    );
  }

  static notFound(message = "Resource not found") {
    return this.error(message, 404);
  }

  static badRequest(message = "Bad request", errors?: unknown) {
    return this.error(message, 400, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return this.error(message, 401);
  }

  static serverError(message = "Internal server error") {
    return this.error(message, 500);
  }
}
