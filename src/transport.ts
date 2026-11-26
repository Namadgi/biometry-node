import * as http from "node:http";
import * as https from "node:https";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { randomBytes } from "node:crypto";

import type { CallOptions, FileUpload } from "./types.js";
import { parseAPIError } from "./errors.js";
import { BiometryResponse } from "./response.js";

// ---------------------------------------------------------------------------
// Internal transport shared by all services
// ---------------------------------------------------------------------------

/** @internal */
export interface TransportConfig {
  baseURL: string;
  apiKey: string;
  userAgent: string;
  timeoutMs: number;
}

/** @internal Read a Buffer | Readable into a Buffer. */
async function toBuffer(src: Buffer | Readable): Promise<Buffer> {
  if (Buffer.isBuffer(src)) return src;
  const chunks: Buffer[] = [];
  for await (const chunk of src) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/** @internal Build an http(s) request and return the parsed response body + headers. */
async function rawRequest(
  cfg: TransportConfig,
  method: string,
  path: string,
  headers: Record<string, string>,
  body: Buffer | null,
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  bodyBuffer: Buffer;
}> {
  const url = new URL(path, cfg.baseURL);
  const isHttps = url.protocol === "https:";
  const mod = isHttps ? https : http;

  const reqHeaders: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    "User-Agent": cfg.userAgent,
    ...headers,
  };
  if (body) {
    reqHeaders["Content-Length"] = String(body.length);
  }

  return new Promise((resolve, reject) => {
    const req = mod.request(
      url,
      {
        method,
        headers: reqHeaders,
        timeout: cfg.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers,
            body: buf.toString("utf-8"),
            bodyBuffer: buf,
          });
        });
        res.on("error", reject);
      },
    );
    req.on("timeout", () => {
      req.destroy(new Error("Request timed out"));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Call-option -> header mapping
// ---------------------------------------------------------------------------

function callOptionHeaders(opts?: CallOptions): Record<string, string> {
  if (!opts) return {};
  const h: Record<string, string> = {};
  if (opts.deviceInfo !== undefined) h["X-Device-Info"] = opts.deviceInfo;
  if (opts.geoLocation !== undefined) h["X-Geo-Location"] = opts.geoLocation;
  if (opts.requestTags !== undefined) h["X-Request-Tags"] = opts.requestTags;
  if (opts.clientApp !== undefined) h["X-Client-App"] = opts.clientApp;
  if (opts.clientVersion !== undefined) h["X-Client-Version"] = opts.clientVersion;
  return h;
}

// ---------------------------------------------------------------------------
// Multipart builder (zero-dependency)
// ---------------------------------------------------------------------------

async function buildMultipart(
  fields: Record<string, string> | null,
  files: FileUpload[],
): Promise<{ contentType: string; body: Buffer }> {
  const boundary = `----BiometryBoundary${randomBytes(16).toString("hex")}`;
  const parts: Buffer[] = [];
  const CRLF = "\r\n";

  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      parts.push(
        Buffer.from(
          `--${boundary}${CRLF}Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}${value}${CRLF}`,
        ),
      );
    }
  }

  for (const file of files) {
    const fileBuffer = await toBuffer(file.content);
    parts.push(
      Buffer.from(
        `--${boundary}${CRLF}Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.fileName}"${CRLF}Content-Type: application/octet-stream${CRLF}${CRLF}`,
      ),
    );
    parts.push(fileBuffer);
    parts.push(Buffer.from(CRLF));
  }

  parts.push(Buffer.from(`--${boundary}--${CRLF}`));

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat(parts),
  };
}

// ---------------------------------------------------------------------------
// Public transport methods used by services
// ---------------------------------------------------------------------------

/**
 * Send a JSON request and decode the envelope `data` field into T.
 * Pass `undefined` as T type if no response body is expected.
 */
export async function doJSON<T>(
  cfg: TransportConfig,
  method: string,
  path: string,
  payload: unknown | null,
  opts?: CallOptions,
): Promise<T> {
  const headers = callOptionHeaders(opts);
  let body: Buffer | null = null;
  if (payload !== null && payload !== undefined) {
    body = Buffer.from(JSON.stringify(payload));
    headers["Content-Type"] = "application/json";
  }

  const res = await rawRequest(cfg, method, path, headers, body);

  if (res.statusCode >= 400) {
    throw parseAPIError(res.statusCode, res.body);
  }

  if (res.body === "" || res.body === "null") return undefined as T;

  const envelope = JSON.parse(res.body);
  return envelope.data as T;
}

/**
 * Send a multipart request and decode the envelope `data` field into T.
 */
export async function doMultipart<T>(
  cfg: TransportConfig,
  path: string,
  fields: Record<string, string> | null,
  files: FileUpload[],
  opts?: CallOptions,
  method = "POST",
): Promise<T> {
  const headers = callOptionHeaders(opts);
  const mp = await buildMultipart(fields, files);
  headers["Content-Type"] = mp.contentType;

  const res = await rawRequest(cfg, method, path, headers, mp.body);

  if (res.statusCode >= 400) {
    throw parseAPIError(res.statusCode, res.body);
  }

  if (res.body === "" || res.body === "null") return undefined as T;

  const envelope = JSON.parse(res.body);
  return envelope.data as T;
}

/**
 * Send a GET request and return the raw response body bytes (for endpoints that
 * return a non-JSON payload such as an image's octet-stream).
 */
export async function doBytes(
  cfg: TransportConfig,
  method: string,
  path: string,
  opts?: CallOptions,
): Promise<Buffer> {
  const headers = callOptionHeaders(opts);
  const res = await rawRequest(cfg, method, path, headers, null);

  if (res.statusCode >= 400) {
    throw parseAPIError(res.statusCode, res.body);
  }
  return res.bodyBuffer;
}

/**
 * Send a multipart request and return the full BiometryResponse envelope
 * (for endpoints that include scoring data).
 */
export async function doMultipartRaw(
  cfg: TransportConfig,
  path: string,
  fields: Record<string, string> | null,
  files: FileUpload[],
  opts?: CallOptions,
  extraHeaders?: Record<string, string>,
): Promise<BiometryResponse> {
  const headers = { ...callOptionHeaders(opts), ...(extraHeaders ?? {}) };
  const mp = await buildMultipart(fields, files);
  headers["Content-Type"] = mp.contentType;

  const res = await rawRequest(cfg, "POST", path, headers, mp.body);

  if (res.statusCode >= 400) {
    throw parseAPIError(res.statusCode, res.body);
  }

  const body = JSON.parse(res.body);
  return new BiometryResponse(body, res.headers);
}

/**
 * Send a raw GET/POST/PUT/DELETE with no body and decode envelope data into T.
 */
export async function doRaw<T>(
  cfg: TransportConfig,
  method: string,
  path: string,
  opts?: CallOptions,
): Promise<T> {
  const headers = callOptionHeaders(opts);
  const res = await rawRequest(cfg, method, path, headers, null);

  if (res.statusCode >= 400) {
    throw parseAPIError(res.statusCode, res.body);
  }

  if (res.body === "" || res.body === "null") return undefined as T;

  const envelope = JSON.parse(res.body);
  return envelope.data as T;
}

/**
 * Send a raw request and return the full BiometryResponse envelope.
 */
export async function doRawResponse(
  cfg: TransportConfig,
  method: string,
  path: string,
  body: Buffer | null,
  opts?: CallOptions,
  extraHeaders?: Record<string, string>,
): Promise<BiometryResponse> {
  const headers = { ...callOptionHeaders(opts), ...(extraHeaders ?? {}) };
  const res = await rawRequest(cfg, method, path, headers, body);

  if (res.statusCode >= 400) {
    throw parseAPIError(res.statusCode, res.body);
  }

  const parsed = JSON.parse(res.body);
  return new BiometryResponse(parsed, res.headers);
}
