import type { TransportConfig } from "../transport.js";
import { doMultipart, doRaw } from "../transport.js";
import type { CallOptions, DeepfakeCheck, DeepfakeInput } from "../types.js";
import { requestField } from "../v2.js";

const PATH_V2 = "/api-gateway/v2";

/** DeepfakeService handles asynchronous deepfake / anti-video-forgery checks. */
export class DeepfakeService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Submit sends a video for deepfake analysis and returns the created check. */
  async submit(input: DeepfakeInput, opts?: CallOptions): Promise<DeepfakeCheck> {
    const fields = requestField({ user_id: input.userId, session_id: input.sessionId });
    return doMultipart<DeepfakeCheck>(
      this.cfg,
      `${PATH_V2}/deepfake/checks`,
      fields,
      [{ fieldName: "video", fileName: input.fileName, content: input.video }],
      opts,
    );
  }

  /** Status retrieves the current state and results of a deepfake check. */
  async status(requestId: string, opts?: CallOptions): Promise<DeepfakeCheck> {
    return doRaw<DeepfakeCheck>(this.cfg, "GET", `${PATH_V2}/deepfake/checks/${encodeURIComponent(requestId)}`, opts);
  }
}
