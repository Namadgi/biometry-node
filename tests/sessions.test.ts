import { describe, it, afterEach } from "node:test";
import * as assert from "node:assert/strict";
import * as http from "node:http";

import { BiometryClient } from "../src/client.js";

// ---------------------------------------------------------------------------
// Test helper
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

describe("SessionService", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await closeServer(server);
    server = null;
  });

  it("start() sends POST to /sessions/start and returns session ID", async () => {
    const s = await createTestServer((req, res) => {
      assert.equal(req.method, "POST");
      assert.ok(req.url?.endsWith("/api-gateway/sessions/start"));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: "session-abc" }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    const id = await client.sessions.start();
    assert.equal(id, "session-abc");
  });

  it("end() sends POST to /sessions/end/:id with body", async () => {
    const s = await createTestServer(async (req, res) => {
      assert.equal(req.method, "POST");
      assert.ok(req.url?.endsWith("/api-gateway/sessions/end/sess-123"));

      const body = JSON.parse(await readBody(req));
      assert.equal(body.phone_number, "+1234567890");

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "ok" }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    await client.sessions.end("sess-123", { phone_number: "+1234567890" });
  });

  it("end() works without a request body", async () => {
    const s = await createTestServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "ok" }));
    });
    server = s.server;

    const client = new BiometryClient("test-api-key", { baseURL: s.url });
    await client.sessions.end("sess-456");
  });
});
