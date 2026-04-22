import { ponder } from "ponder:registry";
import { loan } from "ponder:schema";

import { LoanProtocol, PPG_ADDRESS } from "@pp/shared";

import { arcadeLoanCoreAbi } from "../abis/arcade";

const PPG_LOWER = PPG_ADDRESS.toLowerCase();
const isPPG = (addr: string) => addr.toLowerCase() === PPG_LOWER;

const loanKey = (loanId: bigint): string =>
  `${LoanProtocol.ARCADE}:${loanId}`;

/**
 * Arcade v3 LoanCore emits LoanStarted(loanId, lender, borrower) without
 * collateral info, so we call getLoan(loanId) at the event block to pull
 * LoanData.terms and filter on collateralAddress == PPG. Ponder pins
 * readContract to event.block.number, so historical reads are correct
 * even if the loan has since been repaid or claimed.
 */
ponder.on("ArcadeLoanCore:LoanStarted", async ({ event, context }) => {
  const data = await context.client.readContract({
    address: event.log.address,
    abi: arcadeLoanCoreAbi,
    functionName: "getLoan",
    args: [event.args.loanId],
  });

  if (!isPPG(data.terms.collateralAddress)) return;

  const startedAt = data.startDate;
  const repayBy = startedAt + data.terms.durationSecs;

  await context.db
    .insert(loan)
    .values({
      id: loanKey(event.args.loanId),
      protocol: LoanProtocol.ARCADE,
      contractAddress: event.log.address,
      borrower: event.args.borrower,
      lender: event.args.lender,
      tokenId: data.terms.collateralId,
      principal: data.terms.principal,
      startedAt,
      repayBy,
      status: "active",
      closedAt: null,
    })
    .onConflictDoNothing();
});

/**
 * LoanRepaid and LoanClaimed fire for every Arcade loan close, PPG or not.
 * The find() short-circuits for non-PPG loans (no row exists) so there's
 * no extra cost beyond a single indexed lookup per event.
 * LoanRolledOver is handled implicitly: LoanCore internally emits
 * LoanRepaid(oldLoanId) + LoanStarted(newLoanId) so our existing handlers
 * close the old row and open the new one.
 */
ponder.on("ArcadeLoanCore:LoanRepaid", async ({ event, context }) => {
  const id = loanKey(event.args.loanId);
  const existing = await context.db.find(loan, { id });
  if (!existing) return;
  await context.db
    .update(loan, { id })
    .set({ status: "repaid", closedAt: event.block.timestamp });
});

ponder.on("ArcadeLoanCore:LoanClaimed", async ({ event, context }) => {
  const id = loanKey(event.args.loanId);
  const existing = await context.db.find(loan, { id });
  if (!existing) return;
  await context.db
    .update(loan, { id })
    .set({ status: "liquidated", closedAt: event.block.timestamp });
});
