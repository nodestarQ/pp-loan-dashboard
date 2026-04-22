import type { Address } from "viem";

import { getEnsClient } from "./client";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RESOLVE_TIMEOUT_MS = 2000;

type CacheEntry = { name: string | null; resolvedAt: number };

// Process-local cache. Phase 14 replaces this with a durable app.ens_cache
// table so resolutions survive container restarts.
const cache = new Map<string, CacheEntry>();

const isFresh = (entry: CacheEntry): boolean =>
	Date.now() - entry.resolvedAt < CACHE_TTL_MS;

/**
 * Batch-resolve reverse ENS for a set of addresses. Cached entries skip the
 * RPC round trip. Misses fan out in parallel; viem's multicall batching
 * collapses them into a single request. The whole batch is wall-capped at
 * RESOLVE_TIMEOUT_MS so slow RPC can never stall the page load.
 *
 * Returns a Map keyed by the original address string (case preserved) with
 * `null` for addresses that timed out, errored, or have no primary name.
 */
export async function resolveEnsNames(
	addresses: Address[],
): Promise<Map<string, string | null>> {
	const result = new Map<string, string | null>();
	const misses: Address[] = [];

	for (const addr of addresses) {
		const key = addr.toLowerCase();
		const entry = cache.get(key);
		if (entry && isFresh(entry)) {
			result.set(addr, entry.name);
		} else {
			misses.push(addr);
		}
	}

	if (misses.length === 0) return result;

	const client = getEnsClient();

	const lookups = Promise.allSettled(
		misses.map(async (addr) => ({
			addr,
			name: await client.getEnsName({ address: addr }),
		})),
	);

	const timeout = new Promise<"timeout">((resolve) =>
		setTimeout(() => resolve("timeout"), RESOLVE_TIMEOUT_MS),
	);

	const winner = await Promise.race([lookups, timeout]);

	if (winner === "timeout") {
		for (const addr of misses) result.set(addr, null);
		return result;
	}

	const now = Date.now();
	for (const r of winner) {
		if (r.status === "fulfilled") {
			const { addr, name } = r.value;
			cache.set(addr.toLowerCase(), { name, resolvedAt: now });
			result.set(addr, name);
		}
	}

	// Any miss that didn't resolve successfully gets null.
	for (const addr of misses) {
		if (!result.has(addr)) result.set(addr, null);
	}

	return result;
}
