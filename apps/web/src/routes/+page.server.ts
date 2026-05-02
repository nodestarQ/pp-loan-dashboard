import { env as pubEnv } from "$env/dynamic/public";
import {
	getActiveLoanCount,
	getActiveParticipantCounts,
	getTopHolders,
	getTopLoanAddresses,
	safeQuery,
} from "$lib/server/db/queries";
import { resolveProfiles, type Profile } from "$lib/server/profiles/resolve";
import {
	ACCESS_COOKIE,
	hasValidAccess,
	isSoftLaunchActive,
} from "$lib/server/access";
import { SESSION_COOKIE, readSession } from "$lib/server/auth";
import type { PageServerLoad } from "./$types";

const DEFAULT_GOAL = 130;
const EMPTY_PROFILE: Profile = { username: null, pfpUrl: null, twitter: null };

export const load: PageServerLoad = async ({ cookies, setHeaders }) => {
	// In soft-launch mode the password gate (run in hooks) already proved
	// the user belongs here; treat them as fully authed and skip the SIWE
	// wallet whitelist. In production mode (no EARLY_ACCESS_PASSWORD), fall
	// back to the SIWE session check.
	let isAuthed: boolean;
	let sessionAddress: string | null = null;
	if (isSoftLaunchActive()) {
		isAuthed = hasValidAccess(cookies.get(ACCESS_COOKIE));
	} else {
		const session = readSession(cookies.get(SESSION_COOKIE));
		isAuthed = session !== null;
		sessionAddress = session?.address ?? null;
	}

	const [activeLoans, participants] = await Promise.all([
		safeQuery(() => getActiveLoanCount(), 0, "activeLoanCount"),
		safeQuery(
			() => getActiveParticipantCounts(),
			{ borrowers: 0, lenders: 0 },
			"activeParticipantCounts",
		),
	]);

	const goalTarget = Number(pubEnv.PUBLIC_GOAL_TARGET ?? DEFAULT_GOAL);

	if (!isAuthed) {
		// `private, max-age=0` is required even for the unauthed branch:
		// otherwise the browser heuristically caches __data.json and serves
		// the stale unauthed copy after a successful sign-in, leaving the
		// UI stuck on the gate even though the cookie is valid.
		setHeaders({
			"cache-control": "private, max-age=0, must-revalidate",
		});
		return {
			activeLoans,
			participants,
			topHolders: null,
			topLoanAddresses: null,
			goalTarget,
			isAuthed: false,
			sessionAddress: null,
		};
	}

	const [topHolders, topLoanAddresses] = await Promise.all([
		safeQuery(() => getTopHolders(50), [], "topHolders"),
		// Borrowers are a much smaller set than holders (capped at the
		// number of unique wallets with an active PPG loan, typically
		// a few hundred at most), so we pull them all and paginate on
		// the client rather than artificially truncating the list.
		safeQuery(() => getTopLoanAddresses(1000), [], "topLoanAddresses"),
	]);

	const uniqueAddresses = new Set<string>();
	for (const h of topHolders) uniqueAddresses.add(h.address);
	for (const l of topLoanAddresses) uniqueAddresses.add(l.borrower);

	const profileMap = await safeQuery(
		() => resolveProfiles(Array.from(uniqueAddresses)),
		new Map<string, Profile>(),
		"resolveProfiles",
	);

	const withProfile = (addr: string): Profile =>
		profileMap.get(addr.toLowerCase()) ?? EMPTY_PROFILE;

	const topHoldersWithProfile = topHolders.map((h) => ({
		...h,
		profile: withProfile(h.address),
	}));
	const topLoanAddressesWithProfile = topLoanAddresses.map((l) => ({
		...l,
		profile: withProfile(l.borrower),
	}));

	// Authed responses carry per-user data, so they must not be share-cached.
	setHeaders({
		"cache-control": "private, max-age=0, must-revalidate",
	});

	return {
		activeLoans,
		participants,
		topHolders: topHoldersWithProfile,
		topLoanAddresses: topLoanAddressesWithProfile,
		goalTarget,
		isAuthed: true,
		sessionAddress,
	};
};
