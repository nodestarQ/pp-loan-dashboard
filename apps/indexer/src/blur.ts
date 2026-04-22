import { ponder } from "ponder:registry";
import { loan } from "ponder:schema";

import { LoanProtocol, PPG_ADDRESS } from "@pp/shared";

const PPG_LOWER = PPG_ADDRESS.toLowerCase();
const isPPG = (addr: string) => addr.toLowerCase() === PPG_LOWER;

const loanKey = (lienId: bigint): string =>
  `${LoanProtocol.BLUR_BLEND}:${lienId}`;

/**
 * Open a new Blend position. Blend is perpetual so repayBy has no natural
 * value; we store 0 as a sentinel and the UI renders it as "perpetual".
 */
ponder.on("BlurBlend:LoanOfferTaken", async ({ event, context }) => {
  if (!isPPG(event.args.collection)) return;

  await context.db
    .insert(loan)
    .values({
      id: loanKey(event.args.lienId),
      protocol: LoanProtocol.BLUR_BLEND,
      contractAddress: event.log.address,
      borrower: event.args.borrower,
      lender: event.args.lender,
      tokenId: event.args.tokenId,
      principal: event.args.loanAmount,
      startedAt: event.block.timestamp,
      repayBy: 0n,
      status: "active",
      closedAt: null,
    })
    .onConflictDoNothing();
});

/**
 * Refinance changes the lender on an existing lien. The loan continues as
 * one logical position (per the plan's "treat refinance as continuous"
 * decision), so we keep the same row and only update the lender.
 */
ponder.on("BlurBlend:Refinance", async ({ event, context }) => {
  if (!isPPG(event.args.collection)) return;
  const id = loanKey(event.args.lienId);

  const existing = await context.db.find(loan, { id });
  if (!existing) return;

  await context.db
    .update(loan, { id })
    .set({ lender: event.args.newLender });
});

ponder.on("BlurBlend:Repay", async ({ event, context }) => {
  if (!isPPG(event.args.collection)) return;
  const id = loanKey(event.args.lienId);

  const existing = await context.db.find(loan, { id });
  if (!existing) return;

  await context.db
    .update(loan, { id })
    .set({ status: "repaid", closedAt: event.block.timestamp });
});

ponder.on("BlurBlend:Seize", async ({ event, context }) => {
  if (!isPPG(event.args.collection)) return;
  const id = loanKey(event.args.lienId);

  const existing = await context.db.find(loan, { id });
  if (!existing) return;

  await context.db
    .update(loan, { id })
    .set({ status: "liquidated", closedAt: event.block.timestamp });
});
