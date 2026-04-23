import { Hono } from "hono";

/**
 * Ponder 0.16+ requires this file to exist as the entry point for any
 * custom HTTP routes served by the indexer. We do not expose the indexer
 * beyond the compose network: the web app reads Postgres directly and
 * proxies Ponder's built-in /status endpoint via /api/sync-status, so
 * this Hono app is intentionally just a landing page for anyone poking
 * at the indexer container directly.
 */
const app = new Hono();

app.get("/", (c) =>
	c.text(
		"pp-loan-dashboard indexer. No public API routes. Use /status, /ready, or /health.",
	),
);

export default app;
