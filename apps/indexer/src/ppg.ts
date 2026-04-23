import { ponder } from "ponder:registry";
import { holder } from "ponder:schema";
import { erc721Abi } from "viem";

import { INDEXER_START_BLOCK, PPG_ADDRESS, PPG_TOTAL_SUPPLY } from "@pp/shared";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Seed the holder table with a full ownership snapshot at INDEXER_START_BLOCK.
 *
 * Without this, accurate per-address balances would require walking every
 * PPG Transfer from deployment (~13.5M blocks), which dominates sync time.
 * Since PPG is a fixed-supply 8888 collection with no post-mint gaps, a
 * multicall of ownerOf() for tokenIds 0..totalSupply-1 at the start block
 * is both complete and cheap (~9 RPC requests via Multicall3).
 *
 * Ponder pins context.client to the source's startBlock during setup, so
 * these reads are deterministic even across restarts. allowFailure is on
 * as a safety net for any historical burns; failed rows are skipped.
 */
ponder.on("PPG:setup", async ({ context }) => {
  const calls = Array.from({ length: PPG_TOTAL_SUPPLY }, (_, tokenId) => ({
    address: PPG_ADDRESS,
    abi: erc721Abi,
    functionName: "ownerOf" as const,
    args: [BigInt(tokenId)] as const,
  }));

  const results = await context.client.multicall({
    contracts: calls,
    allowFailure: true,
  });

  const balances = new Map<string, bigint>();
  for (const r of results) {
    if (r.status !== "success") continue;
    const owner = r.result;
    if (owner === ZERO_ADDRESS) continue;
    balances.set(owner, (balances.get(owner) ?? 0n) + 1n);
  }

  if (balances.size === 0) return;

  const seedBlock = BigInt(INDEXER_START_BLOCK);
  const rows = Array.from(balances, ([address, balance]) => ({
    address: address as `0x${string}`,
    balance,
    firstSeen: seedBlock,
    lastUpdated: seedBlock,
  }));

  await context.db.insert(holder).values(rows).onConflictDoNothing();
});

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
