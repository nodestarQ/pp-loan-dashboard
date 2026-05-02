import type { Handle } from "@sveltejs/kit";

import {
	ACCESS_COOKIE,
	hasValidAccess,
	isSoftLaunchActive,
} from "$lib/server/access";
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

// Benign polling endpoints excluded from the rate limit: they return
// lightweight status data, are hit on a fixed schedule by the client,
// and have no DoS amplification. Adding one here is preferable to
// loosening the global limit for the whole /api/* surface.
const RATE_LIMIT_EXEMPT_PATHS = new Set(["/api/sync-status"]);

// Manual CSP. We allow 'unsafe-inline' on script-src because browser wallet
// extensions (MetaMask, Rabby, etc.) append an inline <script> to inject
// their EIP-1193 provider into the page; a nonced policy permanently
// blocks them. The other directives stay tight: no foreign script hosts,
// no framing, restricted img/connect origins.
const CSP = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: https://*.seadn.io https://openseauserdata.com",
	"font-src 'self' data:",
	"connect-src 'self'",
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"form-action 'self'",
].join("; ");

// Paths that stay public even when the soft-launch password gate is on:
// the unlock form itself, OG share routes (so unfurls work for everyone
// who has the link), the lightweight sync-status poll, and static assets.
function isSoftLaunchPublic(path: string): boolean {
	if (path === "/api/sync-status") return true;
	if (path === "/profile.svg" || path === "/favicon.ico") return true;
	const prefixes = [
		"/unlock",
		"/share",
		"/_app/",
		"/favicons/",
		"/character/",
	];
	return prefixes.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p));
}

function applySecurityHeaders(r: Response): Response {
	r.headers.set("x-content-type-options", "nosniff");
	r.headers.set("referrer-policy", "strict-origin-when-cross-origin");
	r.headers.set("x-frame-options", "DENY");
	r.headers.set("content-security-policy", CSP);
	return r;
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Soft-launch password gate. Runs before everything else so unauthed
	// users never reach load functions or API endpoints (modulo the
	// public allowlist above).
	if (isSoftLaunchActive() && !isSoftLaunchPublic(path)) {
		if (!hasValidAccess(event.cookies.get(ACCESS_COOKIE))) {
			const next = encodeURIComponent(path + event.url.search);
			return applySecurityHeaders(
				new Response(null, {
					status: 302,
					headers: { location: `/unlock?next=${next}` },
				}),
			);
		}
	}

	if (
		path.startsWith("/api/") &&
		!RATE_LIMIT_EXEMPT_PATHS.has(path)
	) {
		const ip = event.getClientAddress();
		const result = consume(ip);
		if (!result.ok) {
			return applySecurityHeaders(
				new Response("Too Many Requests", {
					status: 429,
					headers: {
						"retry-after": String(result.retryAfter),
						"content-type": "text/plain",
					},
				}),
			);
		}
	}

	return applySecurityHeaders(await resolve(event));
};
