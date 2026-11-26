import type { TransportConfig } from "../transport.js";
import { doRaw } from "../transport.js";
import type { CallOptions, ConsentApproval } from "../types.js";

const PATH_V2 = "/api-gateway/v2";

/** ConsentService handles consent approvals (API-key-authenticated only). */
export class ConsentService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Approve approves a consent for a user. */
  async approve(consentId: string, userId: string, opts?: CallOptions): Promise<void> {
    await doRaw<void>(
      this.cfg,
      "POST",
      `${PATH_V2}/consents/${encodeURIComponent(consentId)}/approve/${encodeURIComponent(userId)}`,
      opts,
    );
  }

  /** MyApprovals returns the consent approvals for a user. */
  async myApprovals(userId: string, opts?: CallOptions): Promise<ConsentApproval[]> {
    return doRaw<ConsentApproval[]>(
      this.cfg,
      "GET",
      `${PATH_V2}/consents/my-approvals/${encodeURIComponent(userId)}`,
      opts,
    );
  }
}
