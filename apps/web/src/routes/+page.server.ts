import { env as pubEnv } from "$env/dynamic/public";
import {
	getActiveLoanCount,
	getTopHolders,
	getTopLoanAddresses,
	safeQuery,
} from "$lib/server/db/queries";
import { resolveProfiles, type Profile } from "$lib/server/profiles/resolve";
import type { PageServerLoad } from "./$types";

const DEFAULT_GOAL = 100;
const EMPTY_PROFILE: Profile = { username: null, pfpUrl: null, twitter: null };

export const load: PageServerLoad = async ({ setHeaders }) => {
	const [activeLoans, topHolders, topLoanAddresses] = await Promise.all([
		safeQuery(() => getActiveLoanCount(), 0, "activeLoanCount"),
		safeQuery(() => getTopHolders(20), [], "topHolders"),
		safeQuery(() => getTopLoanAddresses(20), [], "topLoanAddresses"),
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

	const goalTarget = Number(pubEnv.PUBLIC_GOAL_TARGET ?? DEFAULT_GOAL);

	setHeaders({
		"cache-control": "public, s-maxage=60, stale-while-revalidate=300",
	});

	return {
		activeLoans,
		topHolders: topHoldersWithProfile,
		topLoanAddresses: topLoanAddressesWithProfile,
		goalTarget,
	};
};
