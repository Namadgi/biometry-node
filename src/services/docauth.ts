import type { Readable } from "node:stream";
import type { TransportConfig } from "../transport.js";
import { doMultipartRaw } from "../transport.js";
import type { CallOptions } from "../types.js";
import { BiometryResponse } from "../response.js";

const PATH_GATEWAY = "/api-gateway";

/** DocAuthService handles document authentication. */
export class DocAuthService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Check verifies the authenticity of a document image (jpg, jpeg, or png). */
  async check(
    document: Buffer | Readable,
    fileName: string,
    opts?: CallOptions,
  ): Promise<BiometryResponse> {
    return doMultipartRaw(
      this.cfg,
      `${PATH_GATEWAY}/docauth/check`,
      null,
      [{ fieldName: "document", fileName, content: document }],
      opts,
    );
  }
}
