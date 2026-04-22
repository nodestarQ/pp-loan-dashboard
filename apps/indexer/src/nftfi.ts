import { ponder } from "ponder:registry";
import { loan } from "ponder:schema";

import { LoanProtocol, PPG_ADDRESS } from "@pp/shared";

const PPG_LOWER = PPG_ADDRESS.toLowerCase();
const isPPG = (addr: string) => addr.toLowerCase() === PPG_LOWER;

const loanKey = (contract: string, loanId: number | bigint): string =>
  `${LoanProtocol.NFTFI}:${contract.toLowerCase()}:${loanId}`;

/**
 * Both NFTfi v2 contracts (DirectLoanFixedOffer and its v2.3 redeploy) inherit
 * the same base and emit identical events, so one handler closure handles
 * both. We filter for PPG collateral inside each handler because the
 * collateral contract is not an indexed event parameter.
 */
for (const source of ["NFTfiV2", "NFTfiV23"] as const) {
  ponder.on(`${source}:LoanStarted`, async ({ event, context }) => {
    const terms = event.args.loanTerms;
    if (!isPPG(terms.nftCollateralContract)) return;

    const startedAt = terms.loanStartTime;
    const repayBy = startedAt + BigInt(terms.loanDuration);

    await context.db
      .insert(loan)
      .values({
        id: loanKey(event.log.address, event.args.loanId),
        protocol: LoanProtocol.NFTFI,
        contractAddress: event.log.address,
        borrower: event.args.borrower,
        lender: event.args.lender,
        tokenId: terms.nftCollateralId,
        principal: terms.loanPrincipalAmount,
        startedAt,
        repayBy,
        status: "active",
        closedAt: null,
      })
      .onConflictDoNothing();
  });

  ponder.on(`${source}:LoanRepaid`, async ({ event, context }) => {
    if (!isPPG(event.args.nftCollateralContract)) return;
    const id = loanKey(event.log.address, event.args.loanId);

    // If the LoanStarted event landed before our start block we won't have a
    // row to close. Silently ignore rather than throwing; the dashboard is
    // about currently open loans, so losing a handful of early closes is OK.
    const existing = await context.db.find(loan, { id });
    if (!existing) return;

    await context.db
      .update(loan, { id })
      .set({ status: "repaid", closedAt: event.block.timestamp });
  });

  ponder.on(`${source}:LoanLiquidated`, async ({ event, context }) => {
    if (!isPPG(event.args.nftCollateralContract)) return;
    const id = loanKey(event.log.address, event.args.loanId);

    const existing = await context.db.find(loan, { id });
    if (!existing) return;

    await context.db
      .update(loan, { id })
      .set({ status: "liquidated", closedAt: event.block.timestamp });
  });
}
