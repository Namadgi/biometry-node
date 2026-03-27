import type { TransportConfig } from "../transport.js";
import { doMultipartRaw } from "../transport.js";
import type { CallOptions, EnrollFaceInput, EnrollVoiceInput } from "../types.js";
import { BiometryResponse } from "../response.js";

const PATH_GATEWAY = "/api-gateway";

/** EnrollmentService handles face and voice enrollment. */
export class EnrollmentService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Face enrolls a face image for recognition. */
  async face(input: EnrollFaceInput, opts?: CallOptions): Promise<BiometryResponse> {
    const fields: Record<string, string> = {};
    if (input.isDocument) fields["is_document"] = "true";

    return doMultipartRaw(
      this.cfg,
      `${PATH_GATEWAY}/enroll/face`,
      fields,
      [{ fieldName: "face", fileName: input.fileName, content: input.face }],
      opts,
    );
  }

  /** Voice enrolls voice recordings for recognition. */
  async voice(input: EnrollVoiceInput, opts?: CallOptions): Promise<BiometryResponse> {
    const fields: Record<string, string> = {
      phrase: input.phrases.join(","),
    };
    if (input.vocabulary) fields["vocabulary"] = input.vocabulary;

    const files = input.files.map((f) => ({
      fieldName: "voice",
      fileName: f.fileName,
      content: f.content,
    }));

    return doMultipartRaw(this.cfg, `${PATH_GATEWAY}/enroll/voice`, fields, files, opts);
  }
}
