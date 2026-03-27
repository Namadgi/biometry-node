import type { TransportConfig } from "../transport.js";
import { doRaw } from "../transport.js";
import type { CallOptions, APIKeyInfo } from "../types.js";

const PATH_PROJECTS = "/api-projects";

/** APIKeyService manages API keys via the public endpoints. */
export class APIKeyService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Mint creates a new API key. */
  async mint(opts?: CallOptions): Promise<APIKeyInfo> {
    return doRaw<APIKeyInfo>(this.cfg, "POST", `${PATH_PROJECTS}/public/apikeys`, opts);
  }

  /** Revoke deletes an API key by ID. */
  async revoke(keyId: string, opts?: CallOptions): Promise<void> {
    await doRaw<void>(this.cfg, "DELETE", `${PATH_PROJECTS}/public/apikeys/${keyId}`, opts);
  }

  /** Info returns information about the current API key. */
  async info(opts?: CallOptions): Promise<APIKeyInfo> {
    return doRaw<APIKeyInfo>(this.cfg, "GET", `${PATH_PROJECTS}/public/apikeys`, opts);
  }
}
