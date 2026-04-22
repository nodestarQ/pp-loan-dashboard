import { onchainTable } from "ponder";

/**
 * One row per address that has ever held a PPG token. Balance is maintained
 * by the Transfer handler; rows are never deleted, so a balance of 0 means
 * the holder sold everything.
 */
export const holder = onchainTable("holder", (t) => ({
  address: t.hex().primaryKey(),
  balance: t.bigint().notNull(),
  firstSeen: t.bigint().notNull(),
  lastUpdated: t.bigint().notNull(),
}));

/**
 * One row per loan across all tracked protocols.
 * - id is "<protocol>:<contract>:<protocolLoanId>" to avoid cross-protocol
 *   and cross-deployment collisions (NFTfi has multiple loan-type contracts).
 * - protocol matches the LoanProtocol enum in @pp/shared.
 * - status transitions: "active" -> "repaid" | "liquidated".
 * - closedAt is null while status = "active", set to the block timestamp
 *   otherwise.
 */
export const loan = onchainTable("loan", (t) => ({
  id: t.text().primaryKey(),
  protocol: t.text().notNull(),
  contractAddress: t.hex().notNull(),
  borrower: t.hex().notNull(),
  lender: t.hex().notNull(),
  tokenId: t.bigint().notNull(),
  principal: t.bigint().notNull(),
  startedAt: t.bigint().notNull(),
  repayBy: t.bigint().notNull(),
  status: t.text().notNull(),
  closedAt: t.bigint(),
}));
