// Main entry point — re-export everything public.

export { BiometryClient, DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS } from "./client.js";
export { BiometryResponse } from "./response.js";
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
  ProcessVideoInput,
  EnrollFaceInput,
  VoiceFile,
  EnrollVoiceInput,
  DocAuthInfo,
  MRZValidation,
  ConsentApproval,
  ImageUploadResponse,
  ImageGetResponse,
  AVFInferenceResponse,
  AVFStatusResponse,
  TransactionListRequest,
  Transaction,
  TransactionDevice,
  DecisionChange,
  Geo,
  APIKeyInfo,
} from "./types.js";

// Service classes (for advanced typing)
export { SessionService } from "./services/sessions.js";
export { VideoService } from "./services/video.js";
export { EnrollmentService } from "./services/enrollment.js";
export { FaceMatchService } from "./services/facematch.js";
export { DocAuthService } from "./services/docauth.js";
export { ConsentService } from "./services/consent.js";
export { ImageService } from "./services/images.js";
export { AVFService } from "./services/avf.js";
export { TransactionService } from "./services/transactions.js";
export { APIKeyService } from "./services/apikeys.js";
