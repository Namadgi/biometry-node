/**
 * BiometryAPIError is thrown for any HTTP 4xx/5xx response from the API.
 */
export class BiometryAPIError extends Error {
  public readonly statusCode: number;
  /**
   * Machine-readable error code from the API v2 error envelope
   * (e.g. "invalid_request", "face_not_detected"). Empty for legacy responses.
   */
  public readonly code: string;
  public readonly rawBody: string;

  constructor(statusCode: number, code: string, message: string, rawBody: string) {
    super(`biometry: HTTP ${statusCode}${code ? ` [${code}]` : ""}: ${message}`);
    this.name = "BiometryAPIError";
    this.statusCode = statusCode;
    this.code = code;
    this.rawBody = rawBody;
  }
}

/** Parse an error response body into a BiometryAPIError. */
export function parseAPIError(statusCode: number, body: string): BiometryAPIError {
  let code = "";
  let message = "";

  try {
    const parsed = JSON.parse(body);
    const err = parsed?.error;
    if (err && typeof err === "object") {
      // API v2 error envelope: { error: { code, message }, meta }.
      code = typeof err.code === "string" ? err.code : "";
      if (typeof err.message === "string") {
        message = err.message;
      } else if (err.message != null) {
        message = JSON.stringify(err.message);
      }
    } else if (typeof err === "string") {
      // Legacy shape: { error: "message" }.
      message = err;
    }
    if (!message && typeof parsed?.message === "string") {
      message = parsed.message;
    }
  } catch {
    // not JSON — use raw body
  }

  if (!message) {
    message = body;
  }
  return new BiometryAPIError(statusCode, code, message, body);
}

/** Returns true if the error is a 404 API response. */
export function isNotFound(err: unknown): boolean {
  return err instanceof BiometryAPIError && err.statusCode === 404;
}

/** Returns true if the error is a 403 API response. */
export function isForbidden(err: unknown): boolean {
  return err instanceof BiometryAPIError && err.statusCode === 403;
}

/** Returns true if the error is a 401 API response. */
export function isUnauthorized(err: unknown): boolean {
  return err instanceof BiometryAPIError && err.statusCode === 401;
}
