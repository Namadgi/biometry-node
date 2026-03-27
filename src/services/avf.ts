import type { Readable } from "node:stream";
import type { TransportConfig } from "../transport.js";
import { doMultipart, doRaw } from "../transport.js";
import type { CallOptions, AVFInferenceResponse, AVFStatusResponse } from "../types.js";

const PATH_GATEWAY = "/api-gateway";

/** AVFService handles anti-video-forgery inference. */
export class AVFService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** StartInference submits a video for anti-forgery analysis. */
  async startInference(
    video: Buffer | Readable,
    videoName: string,
    opts?: CallOptions,
  ): Promise<AVFInferenceResponse> {
    return doMultipart<AVFInferenceResponse>(
      this.cfg,
      `${PATH_GATEWAY}/avf/infer`,
      null,
      [{ fieldName: "video", fileName: videoName, content: video }],
      opts,
    );
  }

  /** CheckStatus checks the status of an AVF inference request. */
  async checkStatus(requestId: string, opts?: CallOptions): Promise<AVFStatusResponse> {
    return doRaw<AVFStatusResponse>(
      this.cfg,
      "GET",
      `${PATH_GATEWAY}/avf/status/${requestId}`,
      opts,
    );
  }
}
