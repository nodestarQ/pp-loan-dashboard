import type { Handle } from "@sveltejs/kit";

import { startProfileWorker } from "$lib/server/profiles/worker";

// Kick off the background OpenSea profile syncer once per server start.
// Idempotent: startProfileWorker() no-ops if the interval is already set,
// which matters under Vite HMR where this module can reload repeatedly.
startProfileWorker();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

function consume(ip: string): { ok: boolean; retryAfter: number } {
	const now = Date.now();
	const b = buckets.get(ip);
	if (!b || now - b.windowStart >= RATE_LIMIT_WINDOW_MS) {
		buckets.set(ip, { count: 1, windowStart: now });
		return { ok: true, retryAfter: 0 };
	}
	b.count += 1;
	if (b.count > RATE_LIMIT_MAX) {
		const retryAfter = Math.ceil(
			(RATE_LIMIT_WINDOW_MS - (now - b.windowStart)) / 1000,
		);
		return { ok: false, retryAfter };
	}
	return { ok: true, retryAfter: 0 };
}

// Evict cold buckets so the Map cannot grow unbounded under churn.
const cleanupId = setInterval(() => {
	const now = Date.now();
	for (const [ip, b] of buckets) {
		if (now - b.windowStart > RATE_LIMIT_WINDOW_MS * 5) buckets.delete(ip);
	}
}, RATE_LIMIT_WINDOW_MS);
cleanupId.unref?.();

/**
 * Hook chain:
 *   1. Per-IP token bucket on /api/* (10 req / 60s). Cheap DoS brake.
 *   2. Security headers on every response. CSP itself is configured in
 *      svelte.config.js so SvelteKit can auto-hash its inline bootstrap
 *      scripts without breaking on "script-src 'self'".
 */
export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith("/api/")) {
		const ip = event.getClientAddress();
		const result = consume(ip);
		if (!result.ok) {
			return new Response("Too Many Requests", {
				status: 429,
				headers: {
					"retry-after": String(result.retryAfter),
					"content-type": "text/plain",
				},
			});
		}
	}

	const response = await resolve(event);
	response.headers.set("x-content-type-options", "nosniff");
	response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
	response.headers.set("x-frame-options", "DENY");
	return response;
};
