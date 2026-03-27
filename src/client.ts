import type { TransportConfig } from "./transport.js";
import type { ClientOptions } from "./types.js";
import { SessionService } from "./services/sessions.js";
import { VideoService } from "./services/video.js";
import { EnrollmentService } from "./services/enrollment.js";
import { FaceMatchService } from "./services/facematch.js";
import { DocAuthService } from "./services/docauth.js";
import { ConsentService } from "./services/consent.js";
import { ImageService } from "./services/images.js";
import { AVFService } from "./services/avf.js";
import { TransactionService } from "./services/transactions.js";
import { APIKeyService } from "./services/apikeys.js";

/** Default Biometry API base URL. */
export const DEFAULT_BASE_URL = "https://api.biometrysolutions.com";

/** Default HTTP request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 30_000;

const USER_AGENT = "biometry-node/0.1.0";

/**
 * BiometryClient is the root SDK client. It exposes service-specific
 * sub-clients as public fields.
 *
 * ```ts
 * const client = new BiometryClient("your-api-key-jwt", {
 *   userFullname: "John Doe",
 * });
 *
 * const sessionId = await client.sessions.start();
 * ```
 */
export class BiometryClient {
  public readonly sessions: SessionService;
  public readonly video: VideoService;
  public readonly enrollment: EnrollmentService;
  public readonly faceMatch: FaceMatchService;
  public readonly docAuth: DocAuthService;
  public readonly consents: ConsentService;
  public readonly images: ImageService;
  public readonly avf: AVFService;
  public readonly transactions: TransactionService;
  public readonly apiKeys: APIKeyService;

  /** @internal transport configuration shared with all services */
  private readonly cfg: TransportConfig;

  constructor(apiKey: string, options?: ClientOptions) {
    this.cfg = {
      baseURL: options?.baseURL ?? DEFAULT_BASE_URL,
      apiKey,
      userFullname: options?.userFullname ?? "",
      userAgent: options?.userAgent ?? USER_AGENT,
      timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };

    this.sessions = new SessionService(this.cfg);
    this.video = new VideoService(this.cfg);
    this.enrollment = new EnrollmentService(this.cfg);
    this.faceMatch = new FaceMatchService(this.cfg);
    this.docAuth = new DocAuthService(this.cfg);
    this.consents = new ConsentService(this.cfg);
    this.images = new ImageService(this.cfg);
    this.avf = new AVFService(this.cfg);
    this.transactions = new TransactionService(this.cfg);
    this.apiKeys = new APIKeyService(this.cfg);
  }
}
