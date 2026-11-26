import type { Readable } from "node:stream";
import type { TransportConfig } from "../transport.js";
import { doBytes, doMultipart } from "../transport.js";
import type { CallOptions } from "../types.js";

const PATH_V2 = "/api-gateway/v2";

/** ImageService manages a user's reference image (used by face-match). */
export class ImageService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /**
   * Upload stores the reference image for the given user. Requires an approved
   * consent for the user.
   */
  async upload(
    userId: string,
    image: Buffer | Readable,
    fileName: string,
    opts?: CallOptions,
  ): Promise<void> {
    await doMultipart<void>(
      this.cfg,
      `${PATH_V2}/users/${encodeURIComponent(userId)}/reference-image`,
      null,
      [{ fieldName: "image", fileName, content: image }],
      opts,
      "PUT",
    );
  }

  /** Get downloads the stored reference image bytes for the given user. */
  async get(userId: string, opts?: CallOptions): Promise<Buffer> {
    return doBytes(this.cfg, "GET", `${PATH_V2}/users/${encodeURIComponent(userId)}/reference-image`, opts);
  }
}
