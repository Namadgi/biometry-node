import type { TransportConfig } from "./transport.js";
import type { ClientOptions } from "./types.js";
import { SessionService } from "./services/sessions.js";
import { VerificationService } from "./services/verification.js";
import { EnrollmentService } from "./services/enrollment.js";
import { FaceMatchService } from "./services/facematch.js";
import { DocAuthService } from "./services/docauth.js";
import { ConsentService } from "./services/consent.js";
import { ImageService } from "./services/images.js";
import { DeepfakeService } from "./services/deepfake.js";
import { TransactionService } from "./services/transactions.js";
import { APIKeyService } from "./services/apikeys.js";

/** Default Biometry API base URL. */
export const DEFAULT_BASE_URL = "https://api.biometrysolutions.com";

/** Default HTTP request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 30_000;

const USER_AGENT = "biometry-node/0.2.0";

/**
 * BiometryClient is the root SDK client, targeting the Biometry API v2 gateway
 * (/api-gateway/v2). It exposes service-specific sub-clients as public fields.
 *
 * ```ts
 * const client = new BiometryClient("your-api-key-jwt");
 * const sessionId = await client.sessions.start();
 * ```
 *
 * Biometric operations identify the end user with an opaque, customer-provided
 * userId supplied on each call's input object (not a header).
 */
export class BiometryClient {
  public readonly sessions: SessionService;
  public readonly verification: VerificationService;
  public readonly enrollment: EnrollmentService;
  public readonly faceMatch: FaceMatchService;
  public readonly docAuth: DocAuthService;
  public readonly consents: ConsentService;
  public readonly images: ImageService;
  public readonly deepfake: DeepfakeService;
  public readonly transactions: TransactionService;
  public readonly apiKeys: APIKeyService;

  /** @internal transport configuration shared with all services */
  private readonly cfg: TransportConfig;

  constructor(apiKey: string, options?: ClientOptions) {
    this.cfg = {
      baseURL: options?.baseURL ?? DEFAULT_BASE_URL,
      apiKey,
      userAgent: options?.userAgent ?? USER_AGENT,
      timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };

    this.sessions = new SessionService(this.cfg);
    this.verification = new VerificationService(this.cfg);
    this.enrollment = new EnrollmentService(this.cfg);
    this.faceMatch = new FaceMatchService(this.cfg);
    this.docAuth = new DocAuthService(this.cfg);
    this.consents = new ConsentService(this.cfg);
    this.images = new ImageService(this.cfg);
    this.deepfake = new DeepfakeService(this.cfg);
    this.transactions = new TransactionService(this.cfg);
    this.apiKeys = new APIKeyService(this.cfg);
  }
}
