import type { TransportConfig } from "../transport.js";
import { doMultipartRaw } from "../transport.js";
import type { CallOptions, LivenessInput, VerifyInput } from "../types.js";
import type { FileUpload } from "../types.js";
import { requestField } from "../v2.js";
import { BiometryResponse } from "../response.js";

const PATH_V2 = "/api-gateway/v2";

/**
 * VerificationService handles biometric verification. API v2 splits the v1
 * process-video call into three focused operations: liveness, faceVerify, and
 * voiceVerify.
 */
export class VerificationService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Runs the liveness pipeline (face liveness, active speaker, visual speech). */
  async liveness(input: LivenessInput, opts?: CallOptions): Promise<BiometryResponse> {
    const fields = requestField({
      user_id: input.userId,
      phrase: input.phrase,
      vocabulary: input.vocabulary,
      trigger: input.trigger,
      session_id: input.sessionId,
      services: input.excludeServices?.length ? { exclude: input.excludeServices } : undefined,
    });
    return doMultipartRaw(
      this.cfg,
      `${PATH_V2}/liveness`,
      fields,
      [{ fieldName: "video", fileName: input.fileName, content: input.video }],
      opts,
    );
  }

  /** Verifies the face against the user's enrolled face template. */
  async faceVerify(input: VerifyInput, opts?: CallOptions): Promise<BiometryResponse> {
    return this.verify("/face-verify", "video", input, opts);
  }

  /** Verifies the voice against the user's enrolled voice template. */
  async voiceVerify(input: VerifyInput, opts?: CallOptions): Promise<BiometryResponse> {
    return this.verify("/voice-verify", "voice", input, opts);
  }

  private async verify(
    path: string,
    fileField: string,
    input: VerifyInput,
    opts?: CallOptions,
  ): Promise<BiometryResponse> {
    const fields = requestField({
      user_id: input.userId,
      phrase: input.phrase,
      vocabulary: input.vocabulary,
      session_id: input.sessionId,
      use_session_video: input.useSessionVideo,
    });
    // With useSessionVideo the gateway reuses the session's liveness video
    // and ignores an uploaded one, so don't upload it.
    const files: FileUpload[] = input.media && !input.useSessionVideo
      ? [{ fieldName: fileField, fileName: input.fileName ?? "capture", content: input.media }]
      : [];
    return doMultipartRaw(this.cfg, `${PATH_V2}${path}`, fields, files, opts);
  }
}
