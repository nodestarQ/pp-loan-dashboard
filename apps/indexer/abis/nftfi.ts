import { parseAbi } from "viem";

/**
 * Minimal ABI for NFTfi v2 direct-loan contracts (DirectLoanFixedOffer and
 * DirectLoanFixedOfferRedeploy/v2.3). Both inherit DirectLoanBaseMinimal and
 * emit the same LoanStarted / LoanRepaid / LoanLiquidated events.
 *
 * Source of truth:
 * https://github.com/NFTfi-Genesis/nftfi.eth/blob/main/V2/contracts/loans/direct/loanTypes/DirectLoanBaseMinimal.sol
 *
 * Note: nftCollateralContract lives inside the LoanTerms tuple on
 * LoanStarted and as a flat field on the other two, so we filter for PPG
 * inside each handler rather than via Ponder's event-filter config.
 */
export const nftfiAbi = parseAbi([
  "event LoanStarted(uint32 indexed loanId, address indexed borrower, address indexed lender, (uint256 loanPrincipalAmount, uint256 maximumRepaymentAmount, uint256 nftCollateralId, address loanERC20Denomination, uint32 loanDuration, uint16 loanInterestRateForDurationInBasisPoints, uint16 loanAdminFeeInBasisPoints, address nftCollateralWrapper, uint64 loanStartTime, address nftCollateralContract, address borrower) loanTerms, (address revenueSharePartner, uint16 revenueShareInBasisPoints, uint16 referralFeeInBasisPoints) loanExtras)",
  "event LoanRepaid(uint32 indexed loanId, address indexed borrower, address indexed lender, uint256 loanPrincipalAmount, uint256 nftCollateralId, uint256 amountPaidToLender, uint256 adminFee, uint256 revenueShare, address revenueSharePartner, address nftCollateralContract, address loanERC20Denomination)",
  "event LoanLiquidated(uint32 indexed loanId, address indexed borrower, address indexed lender, uint256 loanPrincipalAmount, uint256 nftCollateralId, uint256 loanMaturityDate, uint256 loanLiquidationDate, address nftCollateralContract)",
]);
