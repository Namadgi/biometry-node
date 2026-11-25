# @namadgi/biometry

[![npm version](https://img.shields.io/npm/v/@namadgi/biometry)](https://www.npmjs.com/package/@namadgi/biometry)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

Node.js / TypeScript SDK for the [Biometry](https://biometrysolutions.com) identity verification platform. It calls the Biometry API v2 (`/api-gateway/v2`).

## Installation

```bash
npm install @namadgi/biometry
```

## Quick Start

```typescript
import { BiometryClient } from "@namadgi/biometry";

const client = new BiometryClient("your-api-key");

const sessionId = await client.sessions.start();
console.log("Session started:", sessionId);
```

Every biometric call takes a `userId`: your own opaque, stable key for the end user (not their name or email).

## Full Verification Flow

Enroll the user's face, then verify them in a session: liveness on a video, face verification on the same video, and a face match against their document.

```typescript
import { readFileSync } from "node:fs";
import { BiometryClient } from "@namadgi/biometry";

const client = new BiometryClient("your-api-key");
const userId = "user-123";
const phrase = "one two three four five six seven";

// 1. Record the user's consent (collected in your app). Enrollment needs
//    both authorization and storage consent; give() records both by default.
await client.consents.give(userId);

// 2. Enroll the face
await client.enrollment.face({ userId, face: readFileSync("face.jpg"), fileName: "face.jpg" });

// 3. Start a session
const sessionId = await client.sessions.start();

// 4. Check the identity document
const passport = readFileSync("passport.jpg");
await client.docAuth.check({ document: passport, fileName: "passport.jpg", sessionId });

// 5. Liveness on a video of the user reading the challenge phrase
await client.verification.liveness({
  userId,
  video: readFileSync("selfie.mp4"),
  fileName: "selfie.mp4",
  phrase,
  sessionId,
});

// 6. Face verification on the same video
await client.verification.faceVerify({ userId, phrase, sessionId, useSessionVideo: true });

// 7. Face match: document photo against the session video
const match = await client.faceMatch.match({
  userId,
  referenceImage: passport,
  referenceName: "passport.jpg",
  sessionId,
  useSessionVideo: true,
});
console.log("Face match decision:", match.decision?.status);

// 8. End the session
await client.sessions.end(sessionId);
```

In a session, face verification and face match must use the liveness media: the same file, or `useSessionVideo`.

## Consent

Face and voice enrollment need the user's **authorization** and **storage** consent; `images.upload()` needs authorization consent. Collect the user's agreement in your app, then record it:

```typescript
// Give both (the default; enrollment needs both)
let state = await client.consents.give(userId, {
  sessionId, // optional: shows the consent with this session in the Console
});

// Withdraw storage consent only; authorization is left unchanged
state = await client.consents.revoke(userId, { authorization: false });

// Read the current state (both false if the user never gave consent)
state = await client.consents.status(userId);
console.log(state.authorization, state.storage);
```

`give()` and `revoke()` return the state after the change, are safe to repeat, and throw before sending a request if both `authorization` and `storage` are `false`.

`consents.approve()` and `consents.myApprovals()` manage your project's custom consent templates. They do **not** unlock enrollment.

## Services

| Service | Methods | API v2 |
|---------|---------|--------|
| `sessions` | `start(opts?)`, `end(id, req?, opts?)` | `/v2/sessions` |
| `verification` | `liveness(input)`, `faceVerify(input)`, `voiceVerify(input)` | `/v2/liveness`, `/v2/face-verify`, `/v2/voice-verify` |
| `enrollment` | `face(input)`, `voice(input)` | `/v2/enrollments/face`, `/v2/enrollments/voice` |
| `faceMatch` | `match(input)` | `/v2/face-match` |
| `docAuth` | `check(input)` | `/v2/documents/check` |
| `deepfake` | `submit(input)`, `status(requestId)` | `/v2/deepfake/checks` |
| `images` | `upload(userId, image, fileName)`, `get(userId)` | `/v2/users/{user_id}/reference-image` |
| `consents` | `give(userId, change?)`, `revoke(userId, change?)`, `status(userId)` | `/v2/users/{user_id}/consents` |
| `consents` | `approve(consentId, userId)`, `myApprovals(userId)` | `/v2/consents` (custom templates) |
| `transactions` | `list`, `count`, `getBySession`, `getSamples`, `updateTags`, `flag` | `/api-transactions` (not part of v2) |
| `apiKeys` | `mint`, `revoke`, `info` | `/api-projects` (not part of v2) |

`LivenessInput.excludeServices` skips checks by name; use the `VerificationServices` constants.

## Per-Request Options

Every service method accepts an optional `CallOptions` object as the last parameter, for request metadata headers:

```typescript
interface CallOptions {
  deviceInfo?: string;    // X-Device-Info (JSON string)
  geoLocation?: string;   // X-Geo-Location (JSON string)
  requestTags?: string;   // X-Request-Tags (comma-separated)
  clientApp?: string;     // X-Client-App
  clientVersion?: string; // X-Client-Version
}
```

User, session and trigger are fields on the input objects, not headers.

## Responses

Calls that return a `BiometryResponse` carry the API v2 envelope `{ data, decision, meta }`:

```typescript
const result = await client.verification.liveness(input);

result.decision;  // { status, score, reasons }; undefined when no scoring system applies
result.data;      // endpoint-specific payload
result.requestId; // request trace ID
```

## Error Handling

API errors throw a `BiometryAPIError` with the HTTP status, the v2 error code and the message:

```typescript
import {
  BiometryAPIError,
  isNotFound,
  isForbidden,
  isUnauthorized,
} from "@namadgi/biometry";

try {
  await client.sessions.start();
} catch (err) {
  if (isUnauthorized(err)) {
    console.error("Invalid API key");
  } else if (isForbidden(err)) {
    console.error("Insufficient permissions");
  } else if (isNotFound(err)) {
    console.error("Resource not found");
  } else if (err instanceof BiometryAPIError) {
    console.error(`API error ${err.statusCode} ${err.code}: ${err.message}`);
  }
}
```

## Documentation

Full API reference and integration guides are available at
[docs.biometrysolutions.com/sdks/node/](https://docs.biometrysolutions.com/sdks/node/).

## License

[MIT](./LICENSE) -- Copyright 2026 [Namadgi Pty Ltd](https://namadgi.com)
