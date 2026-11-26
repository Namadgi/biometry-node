import type { TransportConfig } from "../transport.js";
import { doMultipartRaw } from "../transport.js";
import type { CallOptions, DocAuthInput } from "../types.js";
import { requestField } from "../v2.js";
import { BiometryResponse } from "../response.js";

const PATH_V2 = "/api-gateway/v2";

/** DocAuthService handles document authentication. */
export class DocAuthService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Check verifies the authenticity of a document image (jpg, jpeg, or png). */
  async check(input: DocAuthInput, opts?: CallOptions): Promise<BiometryResponse> {
    const fields = requestField({
      session_id: input.sessionId,
      provider: input.provider,
      mrz_provider: input.mrzProvider,
    });
    return doMultipartRaw(
      this.cfg,
      `${PATH_V2}/documents/check`,
      fields,
      [{ fieldName: "document", fileName: input.fileName, content: input.document }],
      opts,
    );
  }
}
