import { onchainTable } from "ponder";

/**
 * One row per address that has ever held a PPG token. Balance is
 * maintained by the Transfer handler; rows are never deleted, so a
 * balance of 0 means the holder sold everything.
 */
export const holder = onchainTable("holder", (t) => ({
  address: t.hex().primaryKey(),
  balance: t.bigint().notNull(),
  firstSeen: t.bigint().notNull(),
  lastUpdated: t.bigint().notNull(),
}));
