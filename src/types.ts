// ---------------------------------------------------------------------------
// Request / call-option types
// ---------------------------------------------------------------------------

import type { Readable } from "node:stream";

/** Options that can be set on the BiometryClient at construction time. */
export interface ClientOptions {
  /** Override the default base URL (https://api.biometrysolutions.com). */
  baseURL?: string;
  /** Default X-User-Fullname sent with every request. */
  userFullname?: string;
  /** Override the default User-Agent header. */
  userAgent?: string;
  /** HTTP request timeout in milliseconds (default 30 000). */
  timeoutMs?: number;
}

/** Per-request header overrides passed to any service method. */
export interface CallOptions {
  /** Override X-User-Fullname for this request. */
  fullname?: string;
  /** X-Session-ID header. */
  sessionId?: string;
  /** X-Action-Trigger header. */
  actionTrigger?: string;
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
  /** X-Inhouse-Docauth header (boolean). Defaults to true on server. */
  inhouseDocauth?: boolean;
  /** X-Inhouse-MRZ header. Enable MRZ validation. */
  mrzValidation?: boolean;
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
// Video types
// ---------------------------------------------------------------------------

export interface ProcessVideoInput {
  video: Buffer | Readable;
  videoName: string;
  phrase: string;
  vocabulary?: string;
  trigger?: string;
}

// ---------------------------------------------------------------------------
// Enrollment types
// ---------------------------------------------------------------------------

export interface EnrollFaceInput {
  face: Buffer | Readable;
  fileName: string;
  isDocument?: boolean;
}

export interface VoiceFile {
  fileName: string;
  content: Buffer | Readable;
}

export interface EnrollVoiceInput {
  files: VoiceFile[];
  phrases: string[];
  vocabulary?: string;
}

// ---------------------------------------------------------------------------
// DocAuth types
// ---------------------------------------------------------------------------

export interface MRZValidation {
  has_mrz: boolean;
  raw_mrz?: string;
  check_digits_valid: boolean;
  fields_match: boolean;
  discrepancies?: string[];
  validation_performed: boolean;
}

export interface DocAuthInfo {
  document_type: string;
  country_code: string;
  nationality_code: string;
  nationality_name: string;
  sex: string;
  first_name: string;
  father_name: string;
  last_name: string;
  expiry_date: string;
  document_number: string;
  birth_date: string;
  portrait_photo: string;
  signature: string;
  document_category: string;
  issuing_state: string;
  front_document_type_id: string;
  contains_rfid: boolean;
  face_image_base64?: string;
  current_result?: string;
  mrz_validation?: MRZValidation;
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
// Image types
// ---------------------------------------------------------------------------

export interface ImageUploadResponse {
  url: string;
}

export interface ImageGetResponse {
  url: string;
}

// ---------------------------------------------------------------------------
// AVF types
// ---------------------------------------------------------------------------

export interface AVFInferenceResponse {
  request_id: string;
  status: string;
}

export interface AVFStatusResponse {
  request_id: string;
  status: string;
  result?: unknown;
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
