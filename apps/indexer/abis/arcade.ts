import { parseAbi } from "viem";

/**
 * Minimal ABI for Arcade v3 LoanCore.
 *
 * Source of truth:
 * https://github.com/arcadexyz/arcade-protocol/blob/main/contracts/interfaces/ILoanCore.sol
 * https://github.com/arcadexyz/arcade-protocol/blob/main/contracts/libraries/LoanLibrary.sol
 *
 * Event payloads are intentionally slim (no collateral info), so the
 * LoanStarted handler calls getLoan(loanId) to pull LoanData.terms and
 * filter for PPG collateral. LoanRolledOver emits LoanRepaid(old) +
 * LoanStarted(new) internally, so no separate handler is needed.
 */
export const arcadeLoanCoreAbi = parseAbi([
  "event LoanStarted(uint256 loanId, address lender, address borrower)",
  "event LoanRepaid(uint256 loanId)",
  "event LoanClaimed(uint256 loanId)",
  "function getLoan(uint256 loanId) view returns ((uint8 state, uint16 lenderInterestFee, uint16 lenderPrincipalFee, uint64 startDate, uint64 lastAccrualTimestamp, (uint32 interestRate, uint64 durationSecs, address collateralAddress, uint96 deadline, address payableCurrency, uint256 principal, uint256 collateralId, bytes32 affiliateCode) terms, uint256 balance, uint256 interestAmountPaid) loanData)",
]);
