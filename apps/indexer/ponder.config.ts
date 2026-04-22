import { createConfig } from "ponder";
import { erc721Abi } from "viem";

import {
  LOAN_INDEXER_START_BLOCK,
  NFTFI_CONTRACTS,
  PPG_ADDRESS,
  PPG_DEPLOYMENT_BLOCK,
} from "@pp/shared";

import { nftfiAbi } from "./abis/nftfi";

if (!process.env.PONDER_RPC_URL_1) {
  throw new Error("PONDER_RPC_URL_1 env var is required (mainnet JSON-RPC URL)");
}

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1,
    },
  },
  contracts: {
    PPG: {
      chain: "mainnet",
      abi: erc721Abi,
      address: PPG_ADDRESS,
      startBlock: PPG_DEPLOYMENT_BLOCK,
    },
    NFTfiV2: {
      chain: "mainnet",
      abi: nftfiAbi,
      address: NFTFI_CONTRACTS.directLoanFixedOffer,
      startBlock: LOAN_INDEXER_START_BLOCK,
    },
    NFTfiV23: {
      chain: "mainnet",
      abi: nftfiAbi,
      address: NFTFI_CONTRACTS.directLoanFixedOfferRedeploy,
      startBlock: LOAN_INDEXER_START_BLOCK,
    },
  },
});
