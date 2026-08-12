import type { TransportConfig } from "../transport.js";
import { doMultipartRaw } from "../transport.js";
import type { CallOptions, FaceMatchInput, FileUpload } from "../types.js";
import { requestField } from "../v2.js";
import { BiometryResponse } from "../response.js";

const PATH_V2 = "/api-gateway/v2";

/** FaceMatchService matches a live capture against a client-provided reference image. */
export class FaceMatchService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Match compares the live capture against the reference image. */
  async match(input: FaceMatchInput, opts?: CallOptions): Promise<BiometryResponse> {
    const fields = requestField({
      user_id: input.userId,
      session_id: input.sessionId,
      use_session_video: input.useSessionVideo,
    });
    const files: FileUpload[] = [
      { fieldName: "reference_image", fileName: input.referenceName, content: input.referenceImage },
    ];
    if (input.video) {
      files.push({ fieldName: "video", fileName: input.videoName ?? "capture", content: input.video });
    }
    return doMultipartRaw(this.cfg, `${PATH_V2}/face-match`, fields, files, opts);
  }
}
