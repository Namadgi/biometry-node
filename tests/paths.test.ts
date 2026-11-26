import { describe, it, afterEach } from "node:test";
import * as assert from "node:assert/strict";
import * as http from "node:http";

import { BiometryClient } from "../src/client.js";

interface Seen {
  url?: string;
  body?: string;
}

function server(seen: Seen, data: unknown): Promise<{ server: http.Server; url: string }> {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c: Buffer) => chunks.push(c));
      req.on("end", () => {
        seen.url = req.url;
        seen.body = Buffer.concat(chunks).toString();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data, meta: {} }));
      });
    });
    s.listen(0, "127.0.0.1", () => {
      resolve({ server: s, url: `http://127.0.0.1:${(s.address() as { port: number }).port}` });
    });
  });
}

describe("path segments are URI-encoded", () => {
  let srv: http.Server | null = null;
  afterEach(async () => {
    if (srv) await new Promise<void>((r) => srv!.close(() => r()));
    srv = null;
  });

  const cases: [string, (c: BiometryClient) => Promise<unknown>, string][] = [
    ["sessions.end", (c) => c.sessions.end("a/b?c"), "/api-gateway/v2/sessions/a%2Fb%3Fc/end"],
    ["deepfake.status", (c) => c.deepfake.status("r#1"), "/api-gateway/v2/deepfake/checks/r%231"],
    ["images.get", (c) => c.images.get("u/1"), "/api-gateway/v2/users/u%2F1/reference-image"],
    ["consents.approve", (c) => c.consents.approve("t/1", "u?1"), "/api-gateway/v2/consents/t%2F1/approve/u%3F1"],
    ["consents.myApprovals", (c) => c.consents.myApprovals("u/1"), "/api-gateway/v2/consents/my-approvals/u%2F1"],
  ];
  for (const [name, call, path] of cases) {
    it(name, async () => {
      const seen: Seen = {};
      const s = await server(seen, name === "consents.myApprovals" ? [] : {});
      srv = s.server;
      await call(new BiometryClient("k", { baseURL: s.url })).catch(() => undefined);
      assert.equal(seen.url, path);
    });
  }
});

describe("useSessionVideo does not upload media", () => {
  let srv: http.Server | null = null;
  afterEach(async () => {
    if (srv) await new Promise<void>((r) => srv!.close(() => r()));
    srv = null;
  });

  it("faceVerify drops the media part", async () => {
    const seen: Seen = {};
    const s = await server(seen, {});
    srv = s.server;
    const client = new BiometryClient("k", { baseURL: s.url });
    await client.verification.faceVerify({
      userId: "u-1", phrase: "", sessionId: "sess_1", useSessionVideo: true, media: Buffer.from("vid"),
    });
    assert.ok(!seen.body!.includes('name="video"'), "video part must not be sent");
    assert.ok(seen.body!.includes('"use_session_video":true'));
  });

  it("faceMatch drops the video part but keeps the reference image", async () => {
    const seen: Seen = {};
    const s = await server(seen, {});
    srv = s.server;
    const client = new BiometryClient("k", { baseURL: s.url });
    await client.faceMatch.match({
      userId: "u-1", referenceImage: Buffer.from("img"), referenceName: "r.jpg",
      sessionId: "sess_1", useSessionVideo: true, video: Buffer.from("vid"),
    });
    assert.ok(!seen.body!.includes('name="video"'));
    assert.ok(seen.body!.includes('name="reference_image"'));
  });

  it("faceVerify still uploads media without useSessionVideo", async () => {
    const seen: Seen = {};
    const s = await server(seen, {});
    srv = s.server;
    const client = new BiometryClient("k", { baseURL: s.url });
    await client.verification.faceVerify({ userId: "u-1", phrase: "", media: Buffer.from("vid") });
    assert.ok(seen.body!.includes('name="video"'));
  });
});
