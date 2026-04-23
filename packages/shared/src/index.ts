/**
 * Canonical constants for the Pudgy Penguins Huddle Health dashboard.
 * Shared by the Ponder indexer and the SvelteKit web app so contract
 * addresses never drift between the two.
 */

export type Address = `0x${string}`;

/** Pudgy Penguins ERC721 on Ethereum mainnet. */
export const PPG_ADDRESS: Address =
  "0xBd3531dA5CF5857e7CfAA92426877b022e612cf8";

/** Total supply of the PPG collection. Denominator of the health meter. */
export const PPG_TOTAL_SUPPLY = 8888 as const;

/**
 * NFT-lending protocols tracked in v1. Used as a discriminator column on the
 * `loan` table and as an enum in the web UI.
 */
export const LoanProtocol = {
  NFTFI: "nftfi",
  ARCADE: "arcade",
  BLUR_BLEND: "blur",
} as const;
export type LoanProtocol = (typeof LoanProtocol)[keyof typeof LoanProtocol];

/**
 * NFTfi loan contracts relevant to PPG collateral.
 * The active set must be re-confirmed when wiring handlers in
 * apps/indexer/src/nftfi.ts; v2 has several loan-type variants.
 */
export const NFTFI_CONTRACTS = {
  /** NFTfi v2 DirectLoanFixedOffer. */
  directLoanFixedOffer: "0xE52Cec0E90115AbeB3304BaA36bc2655731f7934",
  /** NFTfi DirectLoanFixedOfferRedeploy (v2.3). */
  directLoanFixedOfferRedeploy: "0xD0C6e59B50C32530C627107F50Acc71958C4341F",
} as const satisfies Record<string, Address>;

/** Blur Blend core contract. */
export const BLUR_BLEND_ADDRESS: Address =
  "0x29469395eAf6f95920E59F858042f0e28D98a20B";

/**
 * Arcade.xyz v3 loan contracts. V3 is still the current production version
 * on mainnet; v4 is not yet deployed per the arcadexyz/arcade-protocol repo
 * README. LoanCore emits LoanStarted / LoanRepaid / LoanClaimed but does
 * not embed collateral info in the event payload, so the PPG filter reads
 * LoanCore.getLoan(loanId) at event time.
 *
 * Sources:
 *   https://etherscan.io/address/0x59e57f9a313a2eb1c7357ecc331ddca14209f403
 *   https://github.com/arcadexyz/arcade-protocol
 */
export const ARCADE_CONTRACTS = {
  /** Arcade v3 LoanCore. Emits LoanStarted/LoanRepaid/LoanClaimed. */
  loanCore: "0x59E57F9A313A2eB1c7357ECc331dDCa14209F403",
} as const satisfies Record<string, Address>;

/**
 * Block all indexed sources (PPG + loan contracts) begin at. Scoped to
 * roughly the last 90 days of mainnet history (from 2026-04-23). NFT
 * loan terms rarely exceed 90 days, so this window captures essentially
 * every currently-open position with a healthy buffer, at the cost of
 * 3x more Arcade per-LoanStarted getLoan() readContract calls than a
 * 30-day window.
 *
 * PPG holder balances are NOT derived by walking Transfer history from
 * deployment (block 12_876_000). Instead the indexer's PPG:setup hook
 * multicalls ownerOf() for every tokenId at this block to seed the
 * holder table, then the Transfer handler keeps it in sync from here
 * forward. This collapses the PPG backfill from ~13.5M blocks to ~0
 * and costs only ~9 RPC requests at startup.
 *
 * Bump this forward before a production deploy if significant time has
 * passed since the date above (roughly 216,000 blocks per 30 days).
 */
export const INDEXER_START_BLOCK = 24_168_000 as const;
