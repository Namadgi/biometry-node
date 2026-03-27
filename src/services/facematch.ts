import type { Readable } from "node:stream";
import type { TransportConfig } from "../transport.js";
import { doMultipartRaw } from "../transport.js";
import type { CallOptions } from "../types.js";
import { BiometryResponse } from "../response.js";

const PATH_GATEWAY = "/api-gateway";

/** FaceMatchService handles face matching between images and videos. */
export class FaceMatchService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Match compares faces from an uploaded image and video. */
  async match(
    image: Buffer | Readable,
    imageName: string,
    video: Buffer | Readable,
    videoName: string,
    opts?: CallOptions,
  ): Promise<BiometryResponse> {
    return doMultipartRaw(
      this.cfg,
      `${PATH_GATEWAY}/match-faces`,
      null,
      [
        { fieldName: "image", fileName: imageName, content: image },
        { fieldName: "video", fileName: videoName, content: video },
      ],
      opts,
    );
  }

  /**
   * MatchWithSessionVideo compares a face image against the video from a
   * previous process-video call in the given session. This avoids
   * re-uploading the video.
   */
  async matchWithSessionVideo(
    image: Buffer | Readable,
    imageName: string,
    sessionId: string,
    opts?: CallOptions,
  ): Promise<BiometryResponse> {
    return doMultipartRaw(
      this.cfg,
      `${PATH_GATEWAY}/match-faces`,
      null,
      [{ fieldName: "image", fileName: imageName, content: image }],
      opts,
      {
        "X-Use-Prefilled-Video": "true",
        "X-Session-ID": sessionId,
      },
    );
  }
}
