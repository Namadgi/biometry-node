import { describe, it, afterEach } from "node:test";
import * as assert from "node:assert/strict";
import * as http from "node:http";

import { BiometryClient } from "../src/client.js";
import { BiometryAPIError } from "../src/errors.js";

interface Seen {
  method?: string;
  url?: string;
  contentType?: string;
  body?: string;
}

function consentServer(
  reply: { status: number; body: unknown },
  seen: Seen,
): Promise<{ server: http.Server; url: string }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c: Buffer) => chunks.push(c));
      req.on("end", () => {
        seen.method = req.method;
        seen.url = req.url;
        seen.contentType = req.headers["content-type"];
        seen.body = Buffer.concat(chunks).toString();
        res.writeHead(reply.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(reply.body));
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as { port: number };
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

const ok = (data: unknown) => ({ status: 200, body: { data, meta: {} } });

describe("ConsentService user consent", () => {
  let server: http.Server | null = null;
  afterEach(async () => {
    if (server) await new Promise<void>((r) => server!.close(() => r()));
    server = null;
  });

  it("give() defaults to both consents and PUTs /v2/users/:id/consents", async () => {
    const seen: Seen = {};
    const s = await consentServer(ok({ user_id: "user-123", authorization: true, storage: true }), seen);
    server = s.server;
    const client = new BiometryClient("k", { baseURL: s.url });

    const state = await client.consents.give("user-123");

    assert.equal(seen.method, "PUT");
    assert.equal(seen.url, "/api-gateway/v2/users/user-123/consents");
    assert.equal(seen.contentType, "application/json");
    assert.deepEqual(JSON.parse(seen.body!), { authorization: true, storage: true });
    assert.deepEqual(state, { user_id: "user-123", authorization: true, storage: true });
  });

  it("revoke() sends false for the selected consent only, with session_id", async () => {
    const seen: Seen = {};
    const s = await consentServer(ok({ user_id: "user-123", authorization: true, storage: false }), seen);
    server = s.server;
    const client = new BiometryClient("k", { baseURL: s.url });

    const state = await client.consents.revoke("user-123", { authorization: false, sessionId: "sess_1" });

    assert.equal(seen.method, "PUT");
    assert.deepEqual(JSON.parse(seen.body!), { storage: false, session_id: "sess_1" });
    assert.equal(state.storage, false);
  });

  it("give()/revoke() throw before any request when nothing is selected", async () => {
    const seen: Seen = {};
    const s = await consentServer(ok({}), seen);
    server = s.server;
    const client = new BiometryClient("k", { baseURL: s.url });

    await assert.rejects(client.consents.give("u-1", { authorization: false, storage: false }), /at least one/);
    await assert.rejects(client.consents.revoke("u-1", { authorization: false, storage: false }), /at least one/);
    assert.equal(seen.method, undefined);
  });

  it("status() GETs with an encoded user id", async () => {
    const seen: Seen = {};
    const s = await consentServer(ok({ user_id: "a/b", authorization: true, storage: false }), seen);
    server = s.server;
    const client = new BiometryClient("k", { baseURL: s.url });

    const state = await client.consents.status("a/b");

    assert.equal(seen.method, "GET");
    assert.equal(seen.url, "/api-gateway/v2/users/a%2Fb/consents");
    assert.equal(seen.body, "");
    assert.deepEqual(state, { user_id: "a/b", authorization: true, storage: false });
  });

  it("surfaces API errors as BiometryAPIError", async () => {
    const seen: Seen = {};
    const s = await consentServer(
      { status: 409, body: { error: { code: "session_closed", message: "session is closed" } } },
      seen,
    );
    server = s.server;
    const client = new BiometryClient("k", { baseURL: s.url });

    await assert.rejects(client.consents.give("user-123", { sessionId: "sess_1" }), (err: unknown) => {
      assert.ok(err instanceof BiometryAPIError);
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, "session_closed");
      return true;
    });
  });
});
