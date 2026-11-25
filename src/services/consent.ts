import type { TransportConfig } from "../transport.js";
import { doJSON, doRaw } from "../transport.js";
import type { CallOptions, ConsentApproval, ConsentChange, UserConsents } from "../types.js";

const PATH_V2 = "/api-gateway/v2";

/**
 * ConsentService records user consent (`give`, `revoke`, `status`) and custom
 * consent template approvals (`approve`, `myApprovals`).
 */
export class ConsentService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /**
   * Records that the user consents to Biometry processing (`authorization`)
   * and/or storing (`storage`) their biometric data:
   * `PUT /v2/users/{user_id}/consents`. Both default to `true`.
   *
   * Face and voice enrollment require both consents and fail with 403
   * without them; `images.upload` requires authorization consent. Collect the
   * user's agreement in your app first. Giving a consent the user already
   * gave is a no-op.
   *
   * @returns the user's consent state after the change.
   * @throws {Error} before any request if both are `false`.
   */
  async give(userId: string, change?: ConsentChange, opts?: CallOptions): Promise<UserConsents> {
    return this.set(userId, true, change, opts);
  }

  /**
   * Withdraws the user's authorization and/or storage consent (both default
   * to `true`, i.e. withdraw both). Enrollment fails with 403 afterwards until
   * `give` is called again. Revoking a consent the user never gave is a no-op.
   *
   * @returns the user's consent state after the change.
   * @throws {Error} before any request if both are `false`.
   */
  async revoke(userId: string, change?: ConsentChange, opts?: CallOptions): Promise<UserConsents> {
    return this.set(userId, false, change, opts);
  }

  /**
   * Returns the user's authorization and storage consent:
   * `GET /v2/users/{user_id}/consents`. A user who never gave consent has
   * both `false`.
   */
  async status(userId: string, opts?: CallOptions): Promise<UserConsents> {
    return doJSON<UserConsents>(this.cfg, "GET", userConsentsPath(userId), null, opts);
  }

  private async set(
    userId: string,
    given: boolean,
    change: ConsentChange = {},
    opts?: CallOptions,
  ): Promise<UserConsents> {
    const { authorization = true, storage = true, sessionId } = change;
    if (!authorization && !storage) {
      throw new Error("biometry: at least one of authorization or storage must be true");
    }
    const body: Record<string, unknown> = {};
    if (authorization) body.authorization = given;
    if (storage) body.storage = given;
    if (sessionId) body.session_id = sessionId;
    return doJSON<UserConsents>(this.cfg, "PUT", userConsentsPath(userId), body, opts);
  }

  /**
   * Records the user's approval of one of your project's custom consent
   * templates. It does not give the authorization and storage consent that
   * enrollment requires; use `give` for that.
   */
  async approve(consentId: string, userId: string, opts?: CallOptions): Promise<void> {
    await doRaw<void>(
      this.cfg,
      "POST",
      `${PATH_V2}/consents/${consentId}/approve/${userId}`,
      opts,
    );
  }

  /** Returns the user's custom consent template approvals. */
  async myApprovals(userId: string, opts?: CallOptions): Promise<ConsentApproval[]> {
    return doRaw<ConsentApproval[]>(
      this.cfg,
      "GET",
      `${PATH_V2}/consents/my-approvals/${userId}`,
      opts,
    );
  }
}

function userConsentsPath(userId: string): string {
  return `${PATH_V2}/users/${encodeURIComponent(userId)}/consents`;
}
