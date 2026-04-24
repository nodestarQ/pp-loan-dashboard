import { env } from "$env/dynamic/private";

import { getSql } from "../db/client";
import { fetchOpenSeaProfile, type OpenSeaProfile } from "./opensea";

/**
 * Background profile syncer. Runs inside the web Node process, not on the
 * request path: the page loader just reads whatever is in app.profile.
 *
 * Responsibilities:
 *   1. Every REFRESH_INTERVAL_MS (and once shortly after server startup),
 *      scan holder + active-loan tables for every address we might want to
 *      render.
 *   2. Find the ones whose cached profile is missing or older than TTL_MS.
 *   3. Fetch each from OpenSea, respecting a small concurrency cap, and
 *      upsert into app.profile.
 *
 * Single-instance by design. If the web service is ever scaled beyond one
 * replica, wrap runOnce() in a Postgres advisory lock to prevent N workers
 * from racing each other against the same OpenSea quota.
 */

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CONCURRENCY = 4;
const PER_REQUEST_TIMEOUT_MS = 10_000;
const STARTUP_DELAY_MS = 500;

let intervalHandle: NodeJS.Timeout | null = null;
let runningNow = false;

type Sql = ReturnType<typeof getSql>;

async function collectCandidateAddresses(sql: Sql): Promise<string[]> {
	// Every address the dashboard might render a profile for: holders with
	// a non-zero balance and borrowers on active loans. Lenders are only
	// surfaced as an aggregate count, so they do not need profiles.
	const rows = await sql<{ address: string }[]>`
		SELECT DISTINCT address
		FROM (
			SELECT address FROM holder WHERE balance > 0
			UNION
			SELECT borrower AS address FROM loan WHERE status = 'active'
		) t
	`;
	return rows.map((r) => r.address);
}

async function findStaleAddresses(
	sql: Sql,
	candidates: string[],
): Promise<string[]> {
	if (candidates.length === 0) return [];
	const rows = await sql<{ address: string; resolved_at: Date }[]>`
		SELECT address, resolved_at
		FROM app.profile
		WHERE address = ANY(${candidates})
	`;
	const cutoff = Date.now() - TTL_MS;
	const fresh = new Set(
		rows
			.filter((r) => r.resolved_at.getTime() >= cutoff)
			.map((r) => r.address),
	);
	return candidates.filter((addr) => !fresh.has(addr));
}

async function upsertProfile(
	sql: Sql,
	address: string,
	profile: OpenSeaProfile,
): Promise<void> {
	await sql`
		INSERT INTO app.profile (address, username, pfp_url, twitter, resolved_at)
		VALUES (
			${address},
			${profile.username},
			${profile.pfpUrl},
			${profile.twitter},
			NOW()
		)
		ON CONFLICT (address) DO UPDATE SET
			username = EXCLUDED.username,
			pfp_url = EXCLUDED.pfp_url,
			twitter = EXCLUDED.twitter,
			resolved_at = EXCLUDED.resolved_at
	`;
}

async function runOnce(): Promise<void> {
	if (runningNow) {
		console.info("[profile-worker] previous run still in progress, skipping");
		return;
	}
	const apiKey = env.OPENSEA_API_KEY;
	if (!apiKey) {
		console.info(
			"[profile-worker] OPENSEA_API_KEY not set; worker idle until configured",
		);
		return;
	}

	runningNow = true;
	const startedAt = Date.now();

	try {
		const sql = getSql();
		const candidates = await collectCandidateAddresses(sql);
		const stale = await findStaleAddresses(sql, candidates);

		if (stale.length === 0) {
			console.info(
				`[profile-worker] 0 stale, ${candidates.length} tracked, ` +
					`elapsed=${Date.now() - startedAt}ms`,
			);
			return;
		}

		const queue = [...stale];
		let fetched = 0;
		let errors = 0;

		const workers = Array.from(
			{ length: Math.min(CONCURRENCY, queue.length) },
			async () => {
				while (queue.length > 0) {
					const addr = queue.shift();
					if (!addr) return;
					try {
						const signal = AbortSignal.timeout(PER_REQUEST_TIMEOUT_MS);
						const profile = await fetchOpenSeaProfile(addr, apiKey, signal);
						await upsertProfile(sql, addr, profile);
						fetched += 1;
					} catch (err) {
						errors += 1;
						const msg = err instanceof Error ? err.message : String(err);
						console.warn(`[profile-worker] ${addr}: ${msg}`);
					}
				}
			},
		);

		await Promise.all(workers);

		console.info(
			`[profile-worker] refreshed ${fetched}/${stale.length} ` +
				`(errors: ${errors}, tracked: ${candidates.length}, ` +
				`elapsed=${Date.now() - startedAt}ms)`,
		);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn(`[profile-worker] run failed: ${msg}`);
	} finally {
		runningNow = false;
	}
}

/**
 * Idempotent. Safe to call on every hooks.server.ts module load — if the
 * interval is already set, subsequent calls are no-ops. This matters under
 * Vite HMR where the hooks module may reload repeatedly in dev.
 */
export function startProfileWorker(): void {
	if (intervalHandle) return;

	// Kick the first run slightly after startup so it does not block module
	// initialisation or the first request the server handles.
	const startupTimer = setTimeout(() => {
		void runOnce();
	}, STARTUP_DELAY_MS);
	startupTimer.unref?.();

	intervalHandle = setInterval(() => {
		void runOnce();
	}, REFRESH_INTERVAL_MS);
	intervalHandle.unref?.();
}
