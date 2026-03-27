import type { IncomingHttpHeaders } from "node:http";

/**
 * BiometryResponse is the full API response envelope. Used for endpoints like
 * process-video and match-faces that return scoring data alongside the result.
 */
export class BiometryResponse {
  public readonly data: unknown;
  public readonly scoringResult: unknown;
  public readonly score: number;
  public readonly decisionReasons: string[];
  public readonly message: string;
  public readonly headers: IncomingHttpHeaders;

  constructor(
    body: {
      data?: unknown;
      scoring_result?: unknown;
      score?: number;
      decision_reasons?: string[];
      message?: string;
    },
    headers: IncomingHttpHeaders,
  ) {
    this.data = body.data;
    this.scoringResult = body.scoring_result;
    this.score = body.score ?? 0;
    this.decisionReasons = body.decision_reasons ?? [];
    this.message = body.message ?? "";
    this.headers = headers;
  }

  /** Decode the `data` field into a typed value (JSON parse of raw data). */
  decode<T>(): T {
    return this.data as T;
  }

  /** The X-Request-Id response header value. */
  get requestId(): string {
    return (this.headers["x-request-id"] as string) ?? "";
  }

  /**
   * True if the X-Auto-Enroll response header is "true", indicating that
   * automatic face/voice enrollment was performed.
   */
  get autoEnrolled(): boolean {
    return this.headers["x-auto-enroll"] === "true";
  }

  /**
   * True if the X-Removed-Services response header is "true", indicating
   * some services were dropped due to missing consent.
   */
  get removedServices(): boolean {
    return this.headers["x-removed-services"] === "true";
  }
}
