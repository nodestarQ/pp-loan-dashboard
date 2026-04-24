import { getSql } from "../db/client";
import type { OpenSeaProfile } from "./opensea";

export type Profile = OpenSeaProfile;

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
 * Read-side of the profile subsystem. Looks up app.profile rows for the
 * given addresses and returns them; never calls OpenSea.
 *
 * The OpenSea fetch + upsert work is owned by the background worker in
 * ./worker.ts, which runs inside the same Node process on a timer. That
 * keeps the page loader fast (one SQL round trip, no external API hop)
 * and means OpenSea API traffic scales with the indexed dataset rather
 * than with request traffic.
 *
 * Addresses with no row yet — typically new holders/borrowers the worker
 * has not processed yet — get an all-null Profile so the UI falls back to
 * the shortened address + default avatar cleanly.
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
		console.warn(`[profiles] read failed: ${msg}`);
	}

	const byAddress = new Map(rows.map((r) => [r.address, r]));
	for (const addr of unique) {
		const row = byAddress.get(addr);
		result.set(addr, row ? rowToProfile(row) : EMPTY);
	}

	return result;
}
