// Main entry point — re-export everything public.

export { BiometryClient, DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS } from "./client.js";
export { BiometryResponse } from "./response.js";
export type { Decision, ResponseMeta } from "./response.js";
export { VerificationServices } from "./v2.js";
export type { VerificationServiceName } from "./v2.js";
export {
  BiometryAPIError,
  isNotFound,
  isForbidden,
  isUnauthorized,
} from "./errors.js";

// Types
export type {
  ClientOptions,
  CallOptions,
  FileUpload,
  EndSessionRequest,
  EnrollFaceInput,
  EnrollVoiceInput,
  LivenessInput,
  VerifyInput,
  FaceMatchInput,
  DocAuthInput,
  DocAuthInfo,
  DeepfakeInput,
  DeepfakeCheck,
  ConsentApproval,
  ConsentChange,
  UserConsents,
  TransactionListRequest,
  Transaction,
  TransactionDevice,
  DecisionChange,
  Geo,
  APIKeyInfo,
} from "./types.js";

// Service classes (for advanced typing)
export { SessionService } from "./services/sessions.js";
export { VerificationService } from "./services/verification.js";
export { EnrollmentService } from "./services/enrollment.js";
export { FaceMatchService } from "./services/facematch.js";
export { DocAuthService } from "./services/docauth.js";
export { ConsentService } from "./services/consent.js";
export { ImageService } from "./services/images.js";
export { DeepfakeService } from "./services/deepfake.js";
export { TransactionService } from "./services/transactions.js";
export { APIKeyService } from "./services/apikeys.js";
