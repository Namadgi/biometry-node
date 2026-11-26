// API v2 request helpers shared by the gateway services.

/** Services that can be excluded from the liveness pipeline. */
export const VerificationServices = {
  faceLiveness: "face_liveness_detection",
  activeSpeaker: "active_speaker_detection",
  visualSpeech: "visual_speech_recognition",
  faceRecognition: "face_recognition",
  voiceRecognition: "voice_recognition",
} as const;

export type VerificationServiceName =
  (typeof VerificationServices)[keyof typeof VerificationServices];

/**
 * Fields of the API v2 `request` part. Serialized to JSON and sent as the
 * multipart `request` form field; the gateway decodes it and derives the
 * internal identity/session/service headers (those headers are stripped from
 * the incoming request, so this is the only supported way to pass them).
 */
export interface V2Request {
  user_id?: string;
  session_id?: string;
  phrase?: string;
  vocabulary?: string;
  trigger?: string;
  use_session_video?: boolean;
  provider?: "inhouse" | "idscan";
  mrz_provider?: "inhouse" | "idscan";
  is_document?: boolean;
  services?: { exclude?: string[] };
}

/**
 * Serialize the request fields into the multipart `request` form field,
 * dropping empty/false values to keep the payload lean.
 */
export function requestField(req: V2Request): Record<string, string> {
  const compact: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(req)) {
    if (value === undefined || value === null || value === "" || value === false) {
      continue;
    }
    compact[key] = value;
  }
  return { request: JSON.stringify(compact) };
}
