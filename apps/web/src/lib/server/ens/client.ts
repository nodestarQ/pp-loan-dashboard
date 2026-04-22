import { env } from "$env/dynamic/private";
import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet } from "viem/chains";

/**
 * Default public mainnet RPC used for reverse-ENS resolution.
 * ENS lookups are read-only public data, so using an unauthenticated
 * public node is acceptable and keeps the web container free of any
 * privileged RPC credentials (the Infura key stays in the indexer).
 */
const DEFAULT_RPC = "https://ethereum-rpc.publicnode.com";

let client: PublicClient | undefined;

export function getEnsClient(): PublicClient {
	if (client) return client;
	const rpcUrl = env.ENS_RPC_URL ?? DEFAULT_RPC;
	client = createPublicClient({
		chain: mainnet,
		transport: http(rpcUrl),
		batch: { multicall: true },
	});
	return client;
}
