import { env } from "$env/dynamic/private";
import postgres, { type Sql } from "postgres";

let client: Sql | undefined;

/**
 * Lazy Postgres client. Build-time analysis (SvelteKit's page analyse step)
 * imports +page.server.ts and transitively this file, but does not run the
 * loader, so we cannot throw at module init. Instead the client is created
 * on first use; safeQuery() in queries.ts absorbs startup errors so the
 * dashboard still renders if the indexer has not provisioned tables yet.
 *
 * The compose stack supplies DATABASE_URL using the web_ro role: SELECT
 * on Ponder tables, full access on the app schema.
 */
export function getSql(): Sql {
	if (client) return client;

	const url = env.DATABASE_URL;
	if (!url) {
		throw new Error(
			"DATABASE_URL is required. Set it in .env or your compose environment.",
		);
	}

	client = postgres(url, {
		max: 10,
		connect_timeout: 10,
		idle_timeout: 30,
		prepare: false,
	});
	return client;
}
