import "server-only";

import { NextResponse } from "next/server";

export class ApiRouteError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getHttpStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.status;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return 500;
}

function getHttpMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "body" in error &&
    Array.isArray(error.body) &&
    typeof error.body[0]?.message === "string"
  ) {
    return error.body[0].message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unexpected server error.";
}

export function isUnauthorizedError(error: unknown) {
  return getHttpStatus(error) === 401;
}

export function toErrorResponse(error: unknown) {
  const status = getHttpStatus(error);
  const message = getHttpMessage(error);

  if (status >= 500) {
    console.error(error);
  }

  return NextResponse.json({ message }, { status });
}
