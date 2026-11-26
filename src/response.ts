import type { IncomingHttpHeaders } from "node:http";

/** Scoring decision computed for a request when a scoring system applies. */
export interface Decision {
  status?: string;
  score?: number;
  reasons?: string[];
}

/** Response metadata attached to every API v2 response. */
export interface ResponseMeta {
  request_id?: string;
  message?: string;
}

/**
 * BiometryResponse is the full API v2 success envelope. Used for verification
 * endpoints (liveness, face-verify, voice-verify, face-match, documents/check)
 * that may carry a scoring decision alongside the raw service data.
 */
export class BiometryResponse {
  public readonly data: unknown;
  public readonly decision?: Decision;
  public readonly meta: ResponseMeta;
  public readonly headers: IncomingHttpHeaders;

  constructor(
    body: { data?: unknown; decision?: Decision; meta?: ResponseMeta },
    headers: IncomingHttpHeaders,
  ) {
    this.data = body.data;
    this.decision = body.decision;
    this.meta = body.meta ?? {};
    this.headers = headers;
  }

  /** Decode the `data` field into a typed value. */
  decode<T>(): T {
    return this.data as T;
  }

  /**
   * The request identifier, preferring the envelope meta and falling back to
   * the X-Request-Id response header.
   */
  get requestId(): string {
    return this.meta.request_id ?? (this.headers["x-request-id"] as string) ?? "";
  }
}
