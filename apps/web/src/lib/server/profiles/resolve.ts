import { env } from "$env/dynamic/private";

import { getSql } from "../db/client";
import { fetchOpenSeaProfile, type OpenSeaProfile } from "./opensea";

export type Profile = OpenSeaProfile;

/**
 * How long a resolution (positive OR negative) is considered fresh. OpenSea
 * profiles are relatively stable — 24h is generous for the dashboard and
 * dramatically cuts API quota usage.
 */
const TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Wall-clock cap on the fetch portion of a single page render. If OpenSea
 * is slow or we've queued many lookups, we'd rather return partial results
 * than stall the page. Whatever completes before this deadline is upserted
 * and shows up on this render; the rest get served on the next request.
 */
const FETCH_DEADLINE_MS = 2000;

/**
 * OpenSea's free tier rate-limits per second; with 40 leaderboard addresses
 * and single-digit concurrency we stay well under the ceiling. Raise if
 * you're on a higher tier and the wall-clock deadline is being hit.
 */
const CONCURRENCY = 4;

const EMPTY: Profile = { username: null, pfpUrl: null, twitter: null };

type ProfileRow = {
	address: string;
	username: string | null;
	pfp_url: string | null;
	twitter: string | null;
	resolved_at: Date;
};

const rowToProfile = (r: ProfileRow): Profile => ({
	username: r.username,
	pfpUrl: r.pfp_url,
	twitter: r.twitter,
});

/**
 * Resolve a set of addresses to their OpenSea profile. Flow:
 *   1. Read app.profile for every requested address.
 *   2. Rows with resolved_at within TTL are served from cache immediately.
 *   3. Remaining addresses are fetched from OpenSea, concurrency-limited and
 *      wall-capped. Each completed fetch is upserted so the next render is
 *      faster.
 *   4. Addresses that did not complete within the deadline fall back to any
 *      stale cached row, or to an all-null placeholder.
 *
 * Returns a Map keyed by lowercase address covering every input address.
 * Never throws — errors degrade to empty profiles and a warning log.
 */
export async function resolveProfiles(
	addresses: string[],
): Promise<Map<string, Profile>> {
	const result = new Map<string, Profile>();
	if (addresses.length === 0) return result;

	const unique = Array.from(new Set(addresses.map((a) => a.toLowerCase())));
	const sql = getSql();

	let rows: ProfileRow[] = [];
	try {
		rows = await sql<ProfileRow[]>`
			SELECT address, username, pfp_url, twitter, resolved_at
			FROM app.profile
			WHERE address = ANY(${unique})
		`;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn(`[profiles] cache read failed: ${msg}`);
	}

	const byAddress = new Map(rows.map((r) => [r.address, r]));
	const cutoff = Date.now() - TTL_MS;
	const toFetch: string[] = [];

	for (const addr of unique) {
		const row = byAddress.get(addr);
		if (row && row.resolved_at.getTime() >= cutoff) {
			result.set(addr, rowToProfile(row));
		} else {
			toFetch.push(addr);
			// Serve stale data while we try to refresh in the background of this
			// request. If the fetch beats the deadline we'll overwrite below.
			result.set(addr, row ? rowToProfile(row) : EMPTY);
		}
	}

	if (toFetch.length === 0) return result;

	const apiKey = env.OPENSEA_API_KEY;
	if (!apiKey) {
		console.warn(
			"[profiles] OPENSEA_API_KEY not set; serving cached or empty profiles only",
		);
		return result;
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_DEADLINE_MS);
	const startedAt = Date.now();

	const fetched = new Map<string, Profile>();
	let errors = 0;

	try {
		const queue = [...toFetch];
		const workers = Array.from(
			{ length: Math.min(CONCURRENCY, queue.length) },
			async () => {
				while (!controller.signal.aborted) {
					const addr = queue.shift();
					if (!addr) return;
					try {
						const profile = await fetchOpenSeaProfile(
							addr,
							apiKey,
							controller.signal,
						);
						fetched.set(addr, profile);
					} catch (err) {
						if (controller.signal.aborted) return;
						errors += 1;
						const msg = err instanceof Error ? err.message : String(err);
						console.warn(`[profiles] ${addr}: ${msg}`);
					}
				}
			},
		);
		await Promise.all(workers);
	} finally {
		clearTimeout(timer);
	}

	const elapsed = Date.now() - startedAt;

	if (fetched.size > 0) {
		const now = new Date();
		const batch = Array.from(fetched, ([address, p]) => ({
			address,
			username: p.username,
			pfp_url: p.pfpUrl,
			twitter: p.twitter,
			resolved_at: now,
		}));
		try {
			await sql`
				INSERT INTO app.profile ${sql(batch)}
				ON CONFLICT (address) DO UPDATE SET
					username = EXCLUDED.username,
					pfp_url = EXCLUDED.pfp_url,
					twitter = EXCLUDED.twitter,
					resolved_at = EXCLUDED.resolved_at
			`;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.warn(`[profiles] upsert failed: ${msg}`);
		}
		for (const [addr, profile] of fetched) result.set(addr, profile);
	}

	console.info(
		`[profiles] cache_hit=${unique.length - toFetch.length}` +
			` fetched=${fetched.size}/${toFetch.length}` +
			` errors=${errors} elapsed=${elapsed}ms` +
			(controller.signal.aborted ? " (deadline reached)" : ""),
	);

	return result;
}
