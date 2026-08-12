// ---------------------------------------------------------------------------
// Request / call-option types
// ---------------------------------------------------------------------------

import type { Readable } from "node:stream";
import type { VerificationServiceName } from "./v2.js";

/** Options that can be set on the BiometryClient at construction time. */
export interface ClientOptions {
  /** Override the default base URL (https://api.biometrysolutions.com). */
  baseURL?: string;
  /** Override the default User-Agent header. */
  userAgent?: string;
  /** HTTP request timeout in milliseconds (default 30 000). */
  timeoutMs?: number;
}

/**
 * Per-request header overrides passed to any service method.
 *
 * Note: identity, session, trigger, document-provider, and prefilled-video
 * selection are NOT headers in API v2 — they are fields of the per-call input
 * objects (carried in the JSON `request` part). The options below only cover
 * request-metadata headers the gateway still reads directly.
 */
export interface CallOptions {
  /** X-Device-Info header (JSON string). */
  deviceInfo?: string;
  /** X-Geo-Location header (JSON string). */
  geoLocation?: string;
  /** X-Request-Tags header (comma-separated). */
  requestTags?: string;
  /** X-Client-App header. */
  clientApp?: string;
  /** X-Client-Version header. */
  clientVersion?: string;
}

/** A file to be uploaded as multipart/form-data. */
export interface FileUpload {
  fieldName: string;
  fileName: string;
  content: Buffer | Readable;
}

// ---------------------------------------------------------------------------
// Session types
// ---------------------------------------------------------------------------

export interface EndSessionRequest {
  phone_number?: string;
}

// ---------------------------------------------------------------------------
// Enrollment types
// ---------------------------------------------------------------------------

export interface EnrollFaceInput {
  /** Opaque, customer-provided identity key. */
  userId: string;
  face: Buffer | Readable;
  fileName: string;
  /** Set true if the face image is from a document. */
  isDocument?: boolean;
}

export interface EnrollVoiceInput {
  /** Opaque, customer-provided identity key. */
  userId: string;
  voice: Buffer | Readable;
  fileName: string;
  /** The phrase spoken in the recording. */
  phrase: string;
  vocabulary?: string;
}

// ---------------------------------------------------------------------------
// Verification types
// ---------------------------------------------------------------------------

export interface LivenessInput {
  /** Opaque, customer-provided identity key. */
  userId: string;
  video: Buffer | Readable;
  fileName: string;
  phrase: string;
  vocabulary?: string;
  /** Contextual trigger event name (e.g. "authentication"). */
  trigger?: string;
  /** Session ID for combined scoring. */
  sessionId?: string;
  /** Services to skip from the pipeline. */
  excludeServices?: VerificationServiceName[];
}

export interface VerifyInput {
  /** Opaque, customer-provided identity key. */
  userId: string;
  /** Video (face) or audio/video (voice) file. Omit when useSessionVideo is true. */
  media?: Buffer | Readable;
  fileName?: string;
  phrase: string;
  vocabulary?: string;
  /** Session ID for combined scoring / session-video reuse. */
  sessionId?: string;
  /** Reuse the video captured earlier in the session. Requires sessionId. */
  useSessionVideo?: boolean;
}

// ---------------------------------------------------------------------------
// Face-match types
// ---------------------------------------------------------------------------

export interface FaceMatchInput {
  /** Opaque, customer-provided identity key. */
  userId: string;
  referenceImage: Buffer | Readable;
  referenceName: string;
  /** Live capture to match. Omit when useSessionVideo is true. */
  video?: Buffer | Readable;
  videoName?: string;
  sessionId?: string;
  /** Reuse the video captured earlier in the session. Requires sessionId. */
  useSessionVideo?: boolean;
}

// ---------------------------------------------------------------------------
// DocAuth types
// ---------------------------------------------------------------------------

export interface DocAuthInput {
  document: Buffer | Readable;
  fileName: string;
  sessionId?: string;
  /** Document authenticity provider; defaults to the project configuration. */
  provider?: "inhouse" | "idscan";
  /** MRZ extraction provider; defaults to the project configuration. */
  mrzProvider?: "inhouse" | "idscan";
}

export interface DocAuthInfo {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  document_number?: string;
  expiry_date?: string;
  country_code?: string;
  document_category?: string;
  current_result?: string;
  /** Base64-encoded portrait extracted from the document. */
  portrait_photo?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Deepfake types
// ---------------------------------------------------------------------------

export interface DeepfakeInput {
  /** Opaque, customer-provided identity key. */
  userId: string;
  video: Buffer | Readable;
  fileName: string;
  sessionId?: string;
}

export interface DeepfakeCheck {
  id: string;
  status: string; // pending | processing | completed | failed
  score?: number;
  prediction?: string;
  message?: string;
  created_at?: number; // unix seconds
  completed_at?: number; // unix seconds
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Consent types
// ---------------------------------------------------------------------------

export interface ConsentApproval {
  id: string;
  consent_version_id: string;
  user_id: string;
  is_approved: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Transaction types
// ---------------------------------------------------------------------------

export interface TransactionListRequest {
  project_id?: string;
  session_id?: string;
  user_fullname?: string;
  from_date?: string;
  to_date?: string;
  status_code?: number;
  decision?: string;
  action?: string;
  flag?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface TransactionDevice {
  device_type: string;
  device_os: string;
}

export interface DecisionChange {
  from: string;
  to: string;
  reason: string;
  changed_by: string;
  changed_at: string;
}

export interface Geo {
  ip: string;
  lat: number;
  lng: number;
  country: string;
  city: string;
}

export interface Transaction {
  id: string;
  session_id: string;
  flag: string;
  device: TransactionDevice;
  project_id: string;
  api_key_id: string;
  status_code: number;
  is_success: boolean;
  body_byte_size: number;
  used_services: string[];
  recieved_at: string; // note: backend spelling
  answered_at: string;
  action: string;
  app_version: string;
  duration: number;
  decision: string;
  decision_history: DecisionChange[];
  geo?: Geo;
  tags: string[];
  input_metadata: unknown;
  output_metadata: unknown;
  rules_version: number;
}

// ---------------------------------------------------------------------------
// API Key types
// ---------------------------------------------------------------------------

export interface APIKeyInfo {
  id: string;
  project_id: string;
  name: string;
  state: string;
  selected_services: string[];
  created_at: string;
  expires_at?: string;
}
