import type { Readable } from "node:stream";
import type { TransportConfig } from "../transport.js";
import { doMultipart, doRaw } from "../transport.js";
import type { CallOptions, ImageUploadResponse, ImageGetResponse } from "../types.js";

const PATH_GATEWAY = "/api-gateway";

/** ImageService handles face image upload and retrieval. */
export class ImageService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Upload uploads a face image associated with an email. */
  async upload(
    email: string,
    image: Buffer | Readable,
    fileName: string,
    opts?: CallOptions,
  ): Promise<ImageUploadResponse> {
    return doMultipart<ImageUploadResponse>(
      this.cfg,
      `${PATH_GATEWAY}/images`,
      { email },
      [{ fieldName: "image", fileName, content: image }],
      opts,
    );
  }

  /** Get retrieves the image URL for a given email. */
  async get(email: string, opts?: CallOptions): Promise<ImageGetResponse> {
    return doRaw<ImageGetResponse>(
      this.cfg,
      "GET",
      `${PATH_GATEWAY}/images/${email}`,
      opts,
    );
  }
}
