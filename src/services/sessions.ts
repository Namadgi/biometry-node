import type { TransportConfig } from "../transport.js";
import { doJSON, doRaw } from "../transport.js";
import type { CallOptions, EndSessionRequest } from "../types.js";

const PATH_V2 = "/api-gateway/v2";

/** SessionService handles biometric session lifecycle. */
export class SessionService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Start begins a new biometric session and returns the session ID. */
  async start(opts?: CallOptions): Promise<string> {
    const data = await doRaw<{ session_id: string }>(this.cfg, "POST", `${PATH_V2}/sessions`, opts);
    return data.session_id;
  }

  /** End terminates a session by ID. Pass req to run a SIM-swap check. */
  async end(id: string, req?: EndSessionRequest, opts?: CallOptions): Promise<void> {
    await doJSON<void>(this.cfg, "POST", `${PATH_V2}/sessions/${id}/end`, req ?? null, opts);
  }
}
