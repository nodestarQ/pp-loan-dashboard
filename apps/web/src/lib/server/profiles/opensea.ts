/**
 * Thin wrapper around OpenSea's Accounts v2 endpoint. Returns the subset of
 * fields the leaderboard renders. A 404 from OpenSea means "no profile for
 * this address", which is a valid resolution outcome (not an error) — we
 * return all-null so the caller can cache the negative result.
 *
 * Docs: https://docs.opensea.io/reference/get_account
 */

const BASE_URL = "https://api.opensea.io/api/v2";

export type OpenSeaProfile = {
	username: string | null;
	pfpUrl: string | null;
	twitter: string | null;
};

type AccountResponse = {
	username?: string;
	profile_image_url?: string;
	social_media_accounts?: Array<{ platform?: string; username?: string }>;
};

/**
 * Empty string from the OpenSea JSON counts as "not set" — normalise to null
 * so downstream code has a single sentinel for missing data.
 */
const nullish = (v: string | undefined | null): string | null =>
	v && v.length > 0 ? v : null;

export async function fetchOpenSeaProfile(
	address: string,
	apiKey: string,
	signal: AbortSignal,
): Promise<OpenSeaProfile> {
	const res = await fetch(`${BASE_URL}/accounts/${address}`, {
		headers: {
			accept: "application/json",
			"x-api-key": apiKey,
		},
		signal,
	});

	if (res.status === 404) {
		return { username: null, pfpUrl: null, twitter: null };
	}
	if (!res.ok) {
		throw new Error(`opensea ${res.status} ${res.statusText}`);
	}

	const json = (await res.json()) as AccountResponse;
	const twitter =
		json.social_media_accounts?.find(
			(s) => s.platform?.toLowerCase() === "twitter",
		)?.username ?? null;

	return {
		username: nullish(json.username),
		pfpUrl: nullish(json.profile_image_url),
		twitter: nullish(twitter),
	};
}
