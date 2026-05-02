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
 * Proxies two Ponder endpoints so the browser never needs to reach the
 * indexer directly (indexer has no published host port). Ponder 0.16
 * splits "am I caught up?" (`/ready`: 200 = yes) from "what block are you
 * on?" (`/status`), so we fan out and merge.
 */
export const GET: RequestHandler = async () => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const [readyRes, statusRes] = await Promise.all([
			fetch(`${PONDER_URL}/ready`, { signal: controller.signal }).catch(
				() => null,
			),
			fetch(`${PONDER_URL}/status`, { signal: controller.signal }).catch(
				() => null,
			),
		]);

		if (!readyRes && !statusRes) {
			return json(offline());
		}

		let indexedBlock: number | null = null;
		let indexedAt: number | null = null;
		if (statusRes?.ok) {
			const data = (await statusRes.json()) as {
				mainnet?: { block?: { number?: number; timestamp?: number } };
			};
			indexedBlock = data.mainnet?.block?.number ?? null;
			indexedAt = data.mainnet?.block?.timestamp ?? null;
		}

		return json({
			ready: readyRes?.ok === true,
			indexerReachable: true,
			indexedBlock,
			indexedAt,
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
