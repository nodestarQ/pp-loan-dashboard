import { ponder } from "ponder:registry";
import { holder } from "ponder:schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Maintain a per-address PPG balance by walking every Transfer.
 * Mints (from = 0x0) and burns (to = 0x0) are one-sided; normal transfers
 * decrement the sender and increment the receiver.
 */
ponder.on("PPG:Transfer", async ({ event, context }) => {
  const { from, to } = event.args;
  const blockNumber = event.block.number;

  if (from !== ZERO_ADDRESS) {
    await context.db
      .insert(holder)
      .values({
        address: from,
        balance: 0n,
        firstSeen: blockNumber,
        lastUpdated: blockNumber,
      })
      .onConflictDoUpdate((row) => ({
        balance: row.balance - 1n,
        lastUpdated: blockNumber,
      }));
  }

  if (to !== ZERO_ADDRESS) {
    await context.db
      .insert(holder)
      .values({
        address: to,
        balance: 1n,
        firstSeen: blockNumber,
        lastUpdated: blockNumber,
      })
      .onConflictDoUpdate((row) => ({
        balance: row.balance + 1n,
        lastUpdated: blockNumber,
      }));
  }
});
