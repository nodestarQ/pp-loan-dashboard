import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * Compose-level healthcheck. Intentionally does not touch the database,
 * RPC, or the indexer so a transient downstream blip does not cause the
 * web container to be marked unhealthy.
 */
export const GET: RequestHandler = () => {
	return json({ ok: true });
};
