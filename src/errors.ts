/**
 * BiometryAPIError is thrown for any HTTP 4xx/5xx response from the API.
 */
export class BiometryAPIError extends Error {
  public readonly statusCode: number;
  public readonly rawBody: string;

  constructor(statusCode: number, message: string, rawBody: string) {
    super(`biometry: HTTP ${statusCode}: ${message}`);
    this.name = "BiometryAPIError";
    this.statusCode = statusCode;
    this.rawBody = rawBody;
  }
}

/** Parse an error response body into a BiometryAPIError. */
export function parseAPIError(
  statusCode: number,
  body: string,
): BiometryAPIError {
  let message = "";
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed.error === "string") {
      message = parsed.error;
    } else if (typeof parsed.message === "string") {
      message = parsed.message;
    }
  } catch {
    // not JSON — use raw body
  }
  if (!message) {
    message = body;
  }
  return new BiometryAPIError(statusCode, message, body);
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
