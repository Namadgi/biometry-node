import type { TransportConfig } from "../transport.js";
import { doRaw } from "../transport.js";
import type { CallOptions, ConsentApproval } from "../types.js";

const PATH_GATEWAY = "/api-gateway";

/** ConsentService handles custom consent approvals (API-key-authenticated only). */
export class ConsentService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** Approve approves a custom consent for a user. */
  async approve(consentId: string, userId: string, opts?: CallOptions): Promise<void> {
    await doRaw<void>(
      this.cfg,
      "POST",
      `${PATH_GATEWAY}/custom-consents/${consentId}/approve/${userId}`,
      opts,
    );
  }

  /** MyApprovals returns the consent approvals for a user. */
  async myApprovals(userId: string, opts?: CallOptions): Promise<ConsentApproval[]> {
    return doRaw<ConsentApproval[]>(
      this.cfg,
      "GET",
      `${PATH_GATEWAY}/custom-consents/my-approvals/${userId}`,
      opts,
    );
  }
}
