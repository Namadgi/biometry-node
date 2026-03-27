import { describe, it, afterEach } from "node:test";
import * as assert from "node:assert/strict";
import * as http from "node:http";

import { BiometryClient } from "../src/client.js";
import { BiometryAPIError, isNotFound, isForbidden, isUnauthorized } from "../src/errors.js";

// ---------------------------------------------------------------------------
// Test helper: tiny HTTP server
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
// Tests
// ---------------------------------------------------------------------------

describe("doJSON", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await closeServer(server);
    server = null;
  });

  it("sends auth, user-agent, fullname headers and decodes data envelope", async () => {
    const s = await createTestServer(async (req, res) => {
      // Always send a response, even if assertions fail, to avoid timeouts
      try {
        assert.equal(req.headers["authorization"], "Bearer test-api-key");
        assert.ok(req.headers["user-agent"]?.startsWith("biometry-node/"));
        assert.equal(req.headers["x-user-fullname"], "Test User");
        assert.equal(req.headers["content-type"], "application/json");

        const body = JSON.parse(await readBody(req));
        assert.equal(body.tags[0], "tag1");
      } finally {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "ok" }));
      }
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", {
      baseURL: s.url,
      userFullname: "Test User",
    });

    // Use transactions.updateTags as a JSON endpoint with a known payload
    await client.transactions.updateTags("txn-1", ["tag1"]);
  });

  it("throws BiometryAPIError on 4xx", async () => {
    const s = await createTestServer((_req, res) => {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "bad input" }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });

    await assert.rejects(
      () => client.transactions.list({}),
      (err: unknown) => {
        assert.ok(err instanceof BiometryAPIError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, "biometry: HTTP 400: bad input");
        return true;
      },
    );
  });

  it("handles nil destination (no response body needed)", async () => {
    const s = await createTestServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "ok" }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    // updateTags returns void
    await client.transactions.updateTags("txn-1", ["tag1"]);
  });
});

describe("doMultipart", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await closeServer(server);
    server = null;
  });

  it("sends multipart/form-data with fields and files", async () => {
    const s = await createTestServer(async (req, res) => {
      const ct = req.headers["content-type"] ?? "";
      assert.ok(ct.startsWith("multipart/form-data"));

      const body = await readBody(req);
      // Verify the field and file appear in the body
      assert.ok(body.includes("email"));
      assert.ok(body.includes("test@example.com"));
      assert.ok(body.includes("image-data-bytes"));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: { url: "https://example.com/img.jpg" } }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    const result = await client.images.upload(
      "test@example.com",
      Buffer.from("image-data-bytes"),
      "face.jpg",
    );
    assert.equal(result.url, "https://example.com/img.jpg");
  });
});

describe("doMultipartRaw (response envelope)", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await closeServer(server);
    server = null;
  });

  it("returns full BiometryResponse with scoring data and headers", async () => {
    const s = await createTestServer(async (_req, res) => {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "X-Request-Id": "req-abc-123",
        "X-Auto-Enroll": "true",
        "X-Removed-Services": "true",
      });
      res.end(
        JSON.stringify({
          data: { id: "abc" },
          scoring_result: { status: "approved" },
          score: 92.5,
          decision_reasons: ["face_match"],
          message: "done",
        }),
      );
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    const resp = await client.video.process({
      video: Buffer.from("video-data"),
      videoName: "test.mp4",
      phrase: "hello world",
    });

    assert.equal(resp.score, 92.5);
    assert.deepEqual(resp.decisionReasons, ["face_match"]);
    assert.equal(resp.message, "done");
    assert.equal(resp.requestId, "req-abc-123");
    assert.equal(resp.autoEnrolled, true);
    assert.equal(resp.removedServices, true);

    const data = resp.decode<{ id: string }>();
    assert.equal(data.id, "abc");
  });
});

describe("call options (per-request headers)", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await closeServer(server);
    server = null;
  });

  it("overrides fullname and sets session ID", async () => {
    const s = await createTestServer(async (req, res) => {
      assert.equal(req.headers["x-user-fullname"], "Override Name");
      assert.equal(req.headers["x-session-id"], "sess-123");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: "session-abc" }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", {
      baseURL: s.url,
      userFullname: "Default Name",
    });
    const id = await client.sessions.start({
      fullname: "Override Name",
      sessionId: "sess-123",
    });
    assert.equal(id, "session-abc");
  });

  it("sends docauth, MRZ, device-info, and request-tags headers", async () => {
    const s = await createTestServer(async (req, res) => {
      assert.equal(req.headers["x-inhouse-docauth"], "false");
      assert.equal(req.headers["x-inhouse-mrz"], "true");
      assert.equal(req.headers["x-device-info"], '{"model":"iPhone"}');
      assert.equal(req.headers["x-request-tags"], "vip,test");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "ok" }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    await client.transactions.updateTags("txn-1", ["tag1"], {
      inhouseDocauth: false,
      mrzValidation: true,
      deviceInfo: '{"model":"iPhone"}',
      requestTags: "vip,test",
    });
  });
});

describe("error predicates", () => {
  it("isNotFound returns true for 404", () => {
    assert.equal(isNotFound(new BiometryAPIError(404, "not found", "")), true);
    assert.equal(isNotFound(new BiometryAPIError(400, "bad", "")), false);
    assert.equal(isNotFound(new Error("random")), false);
  });

  it("isForbidden returns true for 403", () => {
    assert.equal(isForbidden(new BiometryAPIError(403, "forbidden", "")), true);
    assert.equal(isForbidden(new BiometryAPIError(404, "not found", "")), false);
  });

  it("isUnauthorized returns true for 401", () => {
    assert.equal(isUnauthorized(new BiometryAPIError(401, "unauth", "")), true);
    assert.equal(isUnauthorized(new BiometryAPIError(403, "forbidden", "")), false);
  });
});
