# Changelog

## 0.2.0 (BM-338)

Migrated the SDK to the **Biometry API v2** gateway (`/api-gateway/v2`). This is a breaking release.

### Breaking changes

- **Identity model:** biometric calls now take an opaque `userId` on their input objects, serialized into the API v2 JSON `request` part. The `X-User-Fullname` header and the `userFullname` / `fullname` / `sessionId` / `actionTrigger` options are removed (the gateway strips identity headers on v2).
- **`client.video` removed**, replaced by **`client.verification`** with `liveness`, `faceVerify`, and `voiceVerify` (the v1 `process-video` split), each taking a typed input object.
- **`client.avf` → `client.deepfake`** (`submit` / `status`), targeting `/v2/deepfake/checks`; response type `AVFInferenceResponse`/`AVFStatusResponse` → `DeepfakeCheck`.
- **`enrollment.face` / `enrollment.voice`** take `EnrollFaceInput` / `EnrollVoiceInput` with `userId`; voice enrollment is now a single file + phrase (was a list).
- **`faceMatch.match`** takes `FaceMatchInput` (`reference_image` + optional `video`, `useSessionVideo`); `matchWithSessionVideo` folded into `useSessionVideo`.
- **`docAuth.check`** takes `DocAuthInput`; the `inhouseDocauth` / `mrzValidation` options are replaced by `provider` / `mrzProvider` (`"inhouse" | "idscan"`).
- **`images`** now manages the user reference image: `upload(userId, image, name)` → `PUT /v2/users/{id}/reference-image`; `get(userId)` returns raw image bytes (`Buffer`).
- **`sessions.start`** targets `POST /v2/sessions` and reads `data.session_id`; `sessions.end` targets `POST /v2/sessions/{id}/end`.
- **`consents`** approvals target `/v2/consents/*`.
- **Response envelope** is now `{ data, decision, meta }`: `BiometryResponse.score` / `scoringResult` / `decisionReasons` / `autoEnrolled` / `removedServices` replaced by `.decision` (`status`/`score`/`reasons`) and `.meta`.
- **Errors:** `BiometryAPIError` now carries `code` from the v2 error envelope; the parser handles v2 (`{error:{code,message}}`), field-error arrays, and the legacy shape.

### Unchanged

- `transactions` (`/api-transactions`) and `apiKeys` (`/api-projects`) are separate services, untouched by the gateway v2 migration.
- Request-metadata options (`deviceInfo`, `geoLocation`, `requestTags`, `clientApp`, `clientVersion`) still apply as headers.
