import type { TransportConfig } from "../transport.js";
import { doMultipartRaw } from "../transport.js";
import type { CallOptions, EnrollFaceInput, EnrollVoiceInput } from "../types.js";
import { requestField } from "../v2.js";
import { BiometryResponse } from "../response.js";

const PATH_V2 = "/api-gateway/v2";

/** EnrollmentService handles face and voice enrollment. */
export class EnrollmentService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Face enrolls a face image for recognition. */
  async face(input: EnrollFaceInput, opts?: CallOptions): Promise<BiometryResponse> {
    const fields = requestField({ user_id: input.userId, is_document: input.isDocument });
    return doMultipartRaw(
      this.cfg,
      `${PATH_V2}/enrollments/face`,
      fields,
      [{ fieldName: "face", fileName: input.fileName, content: input.face }],
      opts,
    );
  }

  /** Voice enrolls a voice recording for recognition. */
  async voice(input: EnrollVoiceInput, opts?: CallOptions): Promise<BiometryResponse> {
    const fields = requestField({
      user_id: input.userId,
      phrase: input.phrase,
      vocabulary: input.vocabulary,
    });
    return doMultipartRaw(
      this.cfg,
      `${PATH_V2}/enrollments/voice`,
      fields,
      [{ fieldName: "voice", fileName: input.fileName, content: input.voice }],
      opts,
    );
  }
}
