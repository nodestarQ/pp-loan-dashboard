import { createConfig } from "ponder";
import { erc721Abi } from "viem";

import {
  ARCADE_CONTRACTS,
  BLEND_DEPLOYMENT_BLOCK,
  BLUR_BLEND_ADDRESS,
  INDEXER_START_BLOCK,
  NFTFI_CONTRACTS,
  PPG_ADDRESS,
} from "@pp/shared";

import { arcadeLoanCoreAbi } from "./abis/arcade";
import { blurBlendAbi } from "./abis/blur";
import { nftfiAbi } from "./abis/nftfi";

if (!process.env.PONDER_RPC_URL_1) {
  throw new Error("PONDER_RPC_URL_1 env var is required (mainnet JSON-RPC URL)");
}

/**
 * RPC fallback chain. Primary is the operator's own key
 * (PONDER_RPC_URL_1). PONDER_RPC_URL_2 / _3 are optional additional
 * paid keys (e.g. Alchemy as a second-source backup). We deliberately
 * do NOT include free public nodes here by default: during early-mainnet
 * PPG backfill we hit eth_getLogs responses from public providers that
 * returned malformed logIndex values (uint32 wrap-around), crashing
 * Ponder's strict response validation. Paid providers are worth the
 * cost of not having to worry about that.
 */
const rpcUrls = [
  process.env.PONDER_RPC_URL_1,
  process.env.PONDER_RPC_URL_2,
  process.env.PONDER_RPC_URL_3,
].filter((u): u is string => typeof u === "string" && u.length > 0);

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: rpcUrls,
      // Infura paid tiers still rate-limit per-method compute-unit
      // throughput, and eth_getBlockByNumber with full tx bodies is
      // one of the most expensive calls Ponder issues during backfill.
      // 25 rps keeps us well under the Developer/Team CU/sec ceilings
      // while still saturating logs ingestion. Raise if you're on a
      // higher tier and seeing idle RPC capacity.
      maxRequestsPerSecond: 90,
    },
  },
  contracts: {
    PPG: {
      chain: "mainnet",
      abi: erc721Abi,
      address: PPG_ADDRESS,
      // Seeded from on-chain ownerOf() at INDEXER_START_BLOCK by the
      // PPG:setup handler. See packages/shared/src/index.ts for the
      // rationale behind not walking Transfer history from deployment.
      startBlock: INDEXER_START_BLOCK,
    },
    NFTfiV2: {
      chain: "mainnet",
      abi: nftfiAbi,
      address: NFTFI_CONTRACTS.directLoanFixedOffer,
      startBlock: INDEXER_START_BLOCK,
    },
    NFTfiV23: {
      chain: "mainnet",
      abi: nftfiAbi,
      address: NFTFI_CONTRACTS.directLoanFixedOfferRedeploy,
      startBlock: INDEXER_START_BLOCK,
    },
    ArcadeLoanCore: {
      chain: "mainnet",
      abi: arcadeLoanCoreAbi,
      address: ARCADE_CONTRACTS.loanCore,
      startBlock: INDEXER_START_BLOCK,
    },
    BlurBlend: {
      chain: "mainnet",
      abi: blurBlendAbi,
      address: BLUR_BLEND_ADDRESS,
      // Blend needs the full history, not the shared 90-day window —
      // see BLEND_DEPLOYMENT_BLOCK's docstring in @pp/shared for the
      // perpetual-loan rationale.
      startBlock: BLEND_DEPLOYMENT_BLOCK,
    },
  },
});
