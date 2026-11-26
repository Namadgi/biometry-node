import { describe, it, afterEach } from "node:test";
import * as assert from "node:assert/strict";
import * as http from "node:http";

import { BiometryClient } from "../src/client.js";
import { BiometryAPIError, isNotFound, isForbidden, isUnauthorized } from "../src/errors.js";
import { VerificationServices } from "../src/v2.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
): Promise<{ server: http.Server; url: string }> {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as { port: number };
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });
}

// ---------------------------------------------------------------------------
// doJSON
// ---------------------------------------------------------------------------

describe("doJSON", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await closeServer(server);
    server = null;
  });

  it("sends auth + user-agent headers and decodes the data envelope", async () => {
    const s = await createTestServer(async (req, res) => {
      try {
        assert.equal(req.headers["authorization"], "Bearer test-api-key");
        assert.ok(req.headers["user-agent"]?.startsWith("biometry-node/"));
        assert.equal(req.headers["content-type"], "application/json");
        const body = JSON.parse(await readBody(req));
        assert.equal(body.tags[0], "tag1");
      } finally {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ meta: {} }));
      }
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    await client.transactions.updateTags("txn-1", ["tag1"]);
  });

  it("throws BiometryAPIError with code on a v2 error envelope", async () => {
    const s = await createTestServer((_req, res) => {
      res.writeHead(422, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: { code: "face_not_detected", message: "no face detected" },
          meta: { request_id: "r9" },
        }),
      );
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    await assert.rejects(
      () => client.transactions.list({}),
      (err: unknown) => {
        assert.ok(err instanceof BiometryAPIError);
        assert.equal(err.statusCode, 422);
        assert.equal(err.code, "face_not_detected");
        assert.equal(err.message, "biometry: HTTP 422 [face_not_detected]: no face detected");
        return true;
      },
    );
  });

  it("parses the legacy string error shape", async () => {
    const s = await createTestServer((_req, res) => {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "bad input" }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    await assert.rejects(
      () => client.transactions.list({}),
      (err: unknown) => {
        assert.ok(err instanceof BiometryAPIError);
        assert.equal(err.message, "biometry: HTTP 400: bad input");
        return true;
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Multipart request part
// ---------------------------------------------------------------------------

describe("multipart request part", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await closeServer(server);
    server = null;
  });

  it("enroll face sends the JSON request part + face file to /v2/enrollments/face", async () => {
    const s = await createTestServer(async (req, res) => {
      assert.ok(req.url?.endsWith("/api-gateway/v2/enrollments/face"));
      const body = await readBody(req);
      assert.ok(body.includes('name="request"'));
      assert.ok(body.includes('"user_id":"user-1"'));
      assert.ok(body.includes('"is_document":true'));
      assert.ok(body.includes('name="face"'));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: { enrolled: true, user_id: "user-1" }, meta: {} }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    const resp = await client.enrollment.face({
      userId: "user-1",
      face: Buffer.from("img"),
      fileName: "f.jpg",
      isDocument: true,
    });
    assert.deepEqual(resp.decode<{ enrolled: boolean }>().enrolled, true);
  });

  it("liveness sends excluded services in the request part", async () => {
    const s = await createTestServer(async (req, res) => {
      assert.ok(req.url?.endsWith("/api-gateway/v2/liveness"));
      const body = await readBody(req);
      assert.ok(body.includes('"exclude":["voice_recognition"]'));
      assert.ok(body.includes('name="video"'));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: { face_liveness_detection: {} }, meta: {} }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    await client.verification.liveness({
      userId: "user-1",
      video: Buffer.from("vid"),
      fileName: "v.mp4",
      phrase: "one two",
      excludeServices: [VerificationServices.voiceRecognition],
    });
  });
});

// ---------------------------------------------------------------------------
// doMultipartRaw (response envelope)
// ---------------------------------------------------------------------------

describe("doMultipartRaw (response envelope)", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await closeServer(server);
    server = null;
  });

  it("returns a BiometryResponse with decision + meta", async () => {
    const s = await createTestServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json", "X-Request-Id": "hdr-id" });
      res.end(
        JSON.stringify({
          data: { face_recognition: {} },
          decision: { status: "pass", score: 92.5, reasons: ["face_match"] },
          meta: { request_id: "req-abc-123", message: "done" },
        }),
      );
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    const resp = await client.verification.faceVerify({
      userId: "user-1",
      media: Buffer.from("video-data"),
      fileName: "test.mp4",
      phrase: "one two",
    });

    assert.equal(resp.decision?.status, "pass");
    assert.equal(resp.decision?.score, 92.5);
    assert.deepEqual(resp.decision?.reasons, ["face_match"]);
    assert.equal(resp.meta.message, "done");
    assert.equal(resp.requestId, "req-abc-123");
  });
});

// ---------------------------------------------------------------------------
// Reference image + metadata headers
// ---------------------------------------------------------------------------

describe("reference image + call options", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await closeServer(server);
    server = null;
  });

  it("upload() PUTs to /v2/users/:id/reference-image", async () => {
    const s = await createTestServer((req, res) => {
      assert.equal(req.method, "PUT");
      assert.ok(req.url?.endsWith("/api-gateway/v2/users/user-1/reference-image"));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ meta: {} }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    await client.images.upload("user-1", Buffer.from("img"), "ref.jpg");
  });

  it("get() returns the raw image bytes", async () => {
    const s = await createTestServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/octet-stream" });
      res.end(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    const bytes = await client.images.get("user-1");
    assert.deepEqual([...bytes], [0x89, 0x50, 0x4e, 0x47]);
  });

  it("sends device-info, request-tags, and client-app headers", async () => {
    const s = await createTestServer((req, res) => {
      assert.equal(req.headers["x-device-info"], '{"model":"iPhone"}');
      assert.equal(req.headers["x-request-tags"], "vip,test");
      assert.equal(req.headers["x-client-app"], "demo");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ meta: {} }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    await client.transactions.updateTags("txn-1", ["tag1"], {
      deviceInfo: '{"model":"iPhone"}',
      requestTags: "vip,test",
      clientApp: "demo",
    });
  });
});

// ---------------------------------------------------------------------------
// Error predicates
// ---------------------------------------------------------------------------

describe("error predicates", () => {
  it("isNotFound returns true for 404", () => {
    assert.equal(isNotFound(new BiometryAPIError(404, "", "not found", "")), true);
    assert.equal(isNotFound(new BiometryAPIError(400, "", "bad", "")), false);
    assert.equal(isNotFound(new Error("random")), false);
  });

  it("isForbidden returns true for 403", () => {
    assert.equal(isForbidden(new BiometryAPIError(403, "", "forbidden", "")), true);
  });

  it("isUnauthorized returns true for 401", () => {
    assert.equal(isUnauthorized(new BiometryAPIError(401, "", "unauth", "")), true);
  });
});
