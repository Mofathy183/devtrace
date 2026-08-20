/**
 * @module lib/errors
 * The typed `ErrorCode` catalog and symmetric success/error response
 * envelope every API route in this app returns, plus `handleRouteError` —
 * the terminal mapping from any thrown error (Zod, DB, unknown) to an
 * envelope and HTTP status. This is the single source of truth every
 * route's `@throws` documentation points back to.
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DbConfigError, DbUnavailableError } from "./db";

/**
 * Every error condition a route can deliberately return. Kept as a
 * closed string union (not a plain `string`) so a typo in a call site
 * is a compile error, not a silent mismatch with client-side handling.
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DB_UNAVAILABLE"
  | "DB_CONFIG_ERROR"
  | "INTERNAL_ERROR";

/** Envelope shape returned by every successful route response. */
export type ApiSuccess<T> = { ok: true; data: T };

/** Envelope shape returned by every failed route response. */
export type ApiFailure = {
  ok: false;
  error: { code: ErrorCode; message: string };
};

/**
 * Builds a successful JSON response in the standard `{ ok: true, data }`
 * envelope.
 *
 * @example
 * return success({ id: "beggy", name: "Beggy" });
 *
 * @param data - The payload to return under `data`.
 * @param status - HTTP status code. Defaults to 200.
 * @returns A `NextResponse` with the success envelope as its JSON body.
 */
export function success<T>(data: T, status = 200) {
  const body: ApiSuccess<T> = { ok: true, data };
  return NextResponse.json(body, { status });
}

/**
 * Builds a failed JSON response in the standard
 * `{ ok: false, error: { code, message } }` envelope. Prefer
 * {@link handleRouteError} over calling this directly from a route —
 * it exists mainly so `handleRouteError` and tests have one shared builder.
 *
 * @param code - The typed error code identifying the failure.
 * @param message - Human-readable message safe to show to a caller.
 * @param status - HTTP status code to return.
 * @returns A `NextResponse` with the failure envelope as its JSON body.
 */
export function failure(code: ErrorCode, message: string, status: number) {
  const body: ApiFailure = { ok: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

/**
 * Central error-to-response mapping. Every route handler's `catch` block
 * should call this and return its result, so failure shapes and status
 * codes are consistent across the whole API regardless of which layer
 * (validation, DB, unknown) threw.
 *
 * @remarks
 * Order matters: checks the most specific error types first
 * (`ZodError`, `DbUnavailableError`, `DbConfigError`) and falls back to
 * a generic 500 for anything unrecognized, logging it server-side so an
 * unhandled case is visible without leaking internals to the client.
 *
 * @param err - The value caught in a route handler's `catch` block.
 * @returns A `NextResponse` with the appropriate failure envelope and HTTP status.
 * @throws {DbUnavailableError} → 503 `DB_UNAVAILABLE`
 * @throws {DbConfigError} → 500 `DB_CONFIG_ERROR`
 * @throws {ZodError} → 400 `VALIDATION_ERROR`
 */
export function handleRouteError(err: unknown) {
  if (err instanceof ZodError) {
    return failure("VALIDATION_ERROR", err.issues.map((i) => i.message).join(", "), 400);
  }
  if (err instanceof DbUnavailableError) {
    return failure(
      "DB_UNAVAILABLE",
      "CognoDB is unreachable right now. Please try again shortly.",
      503
    );
  }
  if (err instanceof DbConfigError) {
    return failure("DB_CONFIG_ERROR", "Server misconfiguration.", 500);
  }
  console.error("Unhandled route error:", err);
  return failure("INTERNAL_ERROR", "Something went wrong.", 500);
}
