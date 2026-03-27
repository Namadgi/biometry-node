import type { TransportConfig } from "../transport.js";
import { doJSON, doRaw } from "../transport.js";
import type { CallOptions, EndSessionRequest } from "../types.js";

const PATH_GATEWAY = "/api-gateway";

/** SessionService handles biometric session lifecycle. */
export class SessionService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Start begins a new biometric session and returns the session ID. */
  async start(opts?: CallOptions): Promise<string> {
    return doRaw<string>(this.cfg, "POST", `${PATH_GATEWAY}/sessions/start`, opts);
  }

  /** End terminates a session by ID. */
  async end(id: string, req?: EndSessionRequest, opts?: CallOptions): Promise<void> {
    await doJSON<void>(this.cfg, "POST", `${PATH_GATEWAY}/sessions/end/${id}`, req ?? null, opts);
  }
}
