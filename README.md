# @namadgi/biometry

[![npm version](https://img.shields.io/npm/v/@namadgi/biometry)](https://www.npmjs.com/package/@namadgi/biometry)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

Node.js / TypeScript SDK for the [Biometry](https://biometrysolutions.com) identity verification platform.

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

## Full Verification Flow

A typical identity verification session includes starting a session, collecting
consent, authenticating documents, enrolling a face, processing a video, running
face match, and ending the session.

```typescript
import { readFile } from "node:fs/promises";
import { BiometryClient } from "@namadgi/biometry";

const client = new BiometryClient("your-api-key", {
  userFullname: "John Doe",
});

// 1. Start session
const sessionId = await client.sessions.start();

const opts = { sessionId };

// 2. Approve consent
await client.consents.approve("consent-id", "user-id", opts);

// 3. Document authentication
const docImage = await readFile("passport.jpg");
const docResult = await client.docAuth.check(docImage, "passport.jpg", opts);
console.log("DocAuth score:", docResult.score);

// 4. Enroll face (from document photo)
const faceImage = await readFile("face.jpg");
const enrollResult = await client.enrollment.face(
  { face: faceImage, fileName: "face.jpg", isDocument: true },
  opts,
);
console.log("Enroll score:", enrollResult.score);

// 5. Process video
const video = await readFile("verification.mp4");
const videoResult = await client.video.process(
  { video, videoName: "verification.mp4", phrase: "my voice is my password" },
  opts,
);
console.log("Video score:", videoResult.score);

// 6. Face match with session video
const matchResult = await client.faceMatch.matchWithSessionVideo(
  faceImage,
  "face.jpg",
  sessionId,
  opts,
);
console.log("Match score:", matchResult.score);

// 7. End session
await client.sessions.end(sessionId, { phone_number: "+1234567890" });
```

## Services

| Service | Method | Description |
|---------|--------|-------------|
| `sessions` | `start(opts?)` | Start a new biometric session |
| `sessions` | `end(id, req?, opts?)` | End a session |
| `consents` | `approve(consentId, userId, opts?)` | Approve a custom consent |
| `consents` | `myApprovals(userId, opts?)` | List consent approvals for a user |
| `docAuth` | `check(document, fileName, opts?)` | Authenticate a document image |
| `enrollment` | `face(input, opts?)` | Enroll a face image |
| `enrollment` | `voice(input, opts?)` | Enroll voice recordings |
| `video` | `process(input, opts?)` | Process a video for biometric verification |
| `faceMatch` | `match(image, imageName, video, videoName, opts?)` | Match faces from image and video |
| `faceMatch` | `matchWithSessionVideo(image, imageName, sessionId, opts?)` | Match face against session video |
| `images` | `upload(email, image, fileName, opts?)` | Upload a face image |
| `images` | `get(email, opts?)` | Retrieve an image URL |
| `avf` | `startInference(video, videoName, opts?)` | Submit video for anti-forgery analysis |
| `avf` | `checkStatus(requestId, opts?)` | Check AVF inference status |
| `transactions` | `list(req, opts?)` | List transactions with filters |
| `transactions` | `count(req, opts?)` | Count transactions matching filters |
| `transactions` | `getBySession(sessionId, opts?)` | Get all transactions for a session |
| `transactions` | `getSamples(id, opts?)` | Get sample data for a transaction |
| `transactions` | `updateTags(id, tags, opts?)` | Update tags on a transaction |
| `transactions` | `flag(id, flag, opts?)` | Set fraud flag on a transaction |
| `apiKeys` | `mint(opts?)` | Create a new API key |
| `apiKeys` | `revoke(keyId, opts?)` | Revoke an API key |
| `apiKeys` | `info(opts?)` | Get current API key info |

## Per-Request Options

Every service method accepts an optional `CallOptions` object as the last
parameter to override headers on a per-request basis:

```typescript
interface CallOptions {
  sessionId?: string;        // X-Session-ID
  fullname?: string;         // X-User-Fullname
  deviceInfo?: string;       // X-Device-Info (JSON string)
  geoLocation?: string;      // X-Geo-Location (JSON string)
  requestTags?: string;      // X-Request-Tags (comma-separated)
  clientApp?: string;        // X-Client-App
  clientVersion?: string;    // X-Client-Version
  inhouseDocauth?: boolean;  // X-Inhouse-Docauth
  mrzValidation?: boolean;   // X-Inhouse-MRZ
  actionTrigger?: string;    // X-Action-Trigger
}
```

## Response Headers

Endpoints that return a `BiometryResponse` expose useful response headers:

```typescript
const result = await client.video.process(input, opts);

result.requestId;       // X-Request-Id — unique request identifier
result.autoEnrolled;    // X-Auto-Enroll — true if auto-enrollment occurred
result.removedServices; // X-Removed-Services — true if services were dropped
```

## Error Handling

All API errors throw a `BiometryAPIError` with the HTTP status code and message:

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
    console.error(`API error ${err.statusCode}: ${err.message}`);
    console.error("Raw body:", err.rawBody);
  }
}
```

## Documentation

Full API reference and integration guides are available at
[docs.biometrysolutions.com/sdks/node/](https://docs.biometrysolutions.com/sdks/node/).

## License

[MIT](./LICENSE) -- Copyright 2026 [Namadgi Pty Ltd](https://namadgi.com)
