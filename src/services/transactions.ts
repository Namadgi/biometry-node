import type { TransportConfig } from "../transport.js";
import { doJSON, doRaw } from "../transport.js";
import type { CallOptions, Transaction, TransactionListRequest } from "../types.js";

const PATH_TRANSACTIONS = "/api-transactions";

/** TransactionService handles transaction queries. */
export class TransactionService {
  /** @internal */
  constructor(private readonly cfg: TransportConfig) {}

  /** List returns transactions matching the given filters. */
  async list(req: TransactionListRequest, opts?: CallOptions): Promise<Transaction[]> {
    return doJSON<Transaction[]>(
      this.cfg,
      "POST",
      `${PATH_TRANSACTIONS}/transactions/list`,
      req,
      opts,
    );
  }

  /** Count returns the number of transactions matching the given filters. */
  async count(req: TransactionListRequest, opts?: CallOptions): Promise<number> {
    const result = await doJSON<{ count: number }>(
      this.cfg,
      "POST",
      `${PATH_TRANSACTIONS}/transactions/count`,
      req,
      opts,
    );
    return result.count;
  }

  /** GetBySession returns all transactions for a session. */
  async getBySession(sessionId: string, opts?: CallOptions): Promise<Transaction[]> {
    return doRaw<Transaction[]>(
      this.cfg,
      "GET",
      `${PATH_TRANSACTIONS}/transactions/sessions/${sessionId}`,
      opts,
    );
  }

  /** GetSamples returns sample data for a transaction. */
  async getSamples(id: string, opts?: CallOptions): Promise<unknown> {
    return doRaw<unknown>(
      this.cfg,
      "GET",
      `${PATH_TRANSACTIONS}/transactions/${id}/samples`,
      opts,
    );
  }

  /** UpdateTags updates the tags on a transaction. */
  async updateTags(id: string, tags: string[], opts?: CallOptions): Promise<void> {
    await doJSON<void>(
      this.cfg,
      "PUT",
      `${PATH_TRANSACTIONS}/transactions/${id}/tags`,
      { tags },
      opts,
    );
  }

  /** Flag sets the fraud flag on a transaction. */
  async flag(id: string, flag: string, opts?: CallOptions): Promise<void> {
    await doJSON<void>(
      this.cfg,
      "PUT",
      `${PATH_TRANSACTIONS}/transactions/${id}/flag`,
      { flag },
      opts,
    );
  }
}
