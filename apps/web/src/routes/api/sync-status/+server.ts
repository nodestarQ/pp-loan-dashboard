import { env } from "$env/dynamic/private";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const PONDER_URL = env.PONDER_URL ?? "http://indexer:42069";
const FETCH_TIMEOUT_MS = 2500;

export type SyncStatus = {
	ready: boolean;
	indexerReachable: boolean;
	indexedBlock: number | null;
	indexedAt: number | null;
};

/**
 * Proxies Ponder's /status endpoint so the browser never needs to reach
 * the indexer directly (indexer has no published host port). The web
 * container has no Infura credentials; this URL is purely the intra-compose
 * address of the indexer's HTTP server.
 */
export const GET: RequestHandler = async () => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const response = await fetch(`${PONDER_URL}/status`, {
			signal: controller.signal,
		});
		if (!response.ok) {
			return json(offline());
		}
		const data = (await response.json()) as {
			mainnet?: {
				ready?: boolean;
				block?: { number?: number; timestamp?: number };
			};
		};
		const mainnet = data.mainnet;
		return json({
			ready: mainnet?.ready === true,
			indexerReachable: true,
			indexedBlock: mainnet?.block?.number ?? null,
			indexedAt: mainnet?.block?.timestamp ?? null,
		} satisfies SyncStatus);
	} catch {
		return json(offline());
	} finally {
		clearTimeout(timer);
	}
};

const offline = (): SyncStatus => ({
	ready: false,
	indexerReachable: false,
	indexedBlock: null,
	indexedAt: null,
});
