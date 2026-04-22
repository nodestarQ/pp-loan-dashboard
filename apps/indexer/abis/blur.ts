import { parseAbi } from "viem";

/**
 * Minimal ABI for Blur's Blend perpetual lending contract.
 *
 * Source of truth:
 * https://github.com/Sabnock01/blur-v2/blob/main/src/blend/interfaces/IBlend.sol
 *
 * Blend loans are perpetual: there is no fixed duration, so we store
 * repayBy = 0 as a sentinel (meaning "no scheduled maturity"). Lifecycle:
 *   LoanOfferTaken  -> active
 *   Refinance       -> lender changes, status unchanged (continuous)
 *   StartAuction    -> still active; auction opens a window where the
 *                      loan can be seized if not repaid. No status change.
 *   Repay           -> repaid
 *   Seize           -> liquidated
 * BuyLocked (marketplace path) is out of scope for v1.
 */
export const blurBlendAbi = parseAbi([
  "event LoanOfferTaken(bytes32 offerHash, uint256 lienId, address collection, address lender, address borrower, uint256 loanAmount, uint256 rate, uint256 tokenId, uint256 auctionDuration)",
  "event Repay(uint256 lienId, address collection)",
  "event Refinance(uint256 lienId, address collection, address newLender, uint256 newAmount, uint256 newRate, uint256 newAuctionDuration)",
  "event Seize(uint256 lienId, address collection)",
]);
