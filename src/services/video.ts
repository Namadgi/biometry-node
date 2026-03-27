import type { TransportConfig } from "../transport.js";
import { doMultipartRaw } from "../transport.js";
import type { CallOptions, ProcessVideoInput } from "../types.js";
import { BiometryResponse } from "../response.js";

const PATH_GATEWAY = "/api-gateway";

/** VideoService handles biometric video processing. */
export class VideoService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /**
   * Process sends a video for biometric verification. Returns the full
   * BiometryResponse envelope which includes scoring results, score, and
   * decision reasons.
   */
  async process(input: ProcessVideoInput, opts?: CallOptions): Promise<BiometryResponse> {
    const fields: Record<string, string> = { phrase: input.phrase };
    if (input.vocabulary) fields["vocabulary"] = input.vocabulary;
    if (input.trigger) fields["trigger"] = input.trigger;

    return doMultipartRaw(
      this.cfg,
      `${PATH_GATEWAY}/process-video`,
      fields,
      [{ fieldName: "video", fileName: input.videoName, content: input.video }],
      opts,
    );
  }
}
