import { env as pubEnv } from "$env/dynamic/public";
import {
	getActiveLoanCount,
	getTopHolders,
	getTopLoanAddresses,
	safeQuery,
} from "$lib/server/db/queries";
import { resolveEnsNames } from "$lib/server/ens/resolve";
import type { Address } from "viem";
import type { PageServerLoad } from "./$types";

const DEFAULT_GOAL = 100;

export const load: PageServerLoad = async ({ setHeaders }) => {
	const [activeLoans, topHolders, topLoanAddresses] = await Promise.all([
		safeQuery(() => getActiveLoanCount(), 0, "activeLoanCount"),
		safeQuery(() => getTopHolders(20), [], "topHolders"),
		safeQuery(() => getTopLoanAddresses(20), [], "topLoanAddresses"),
	]);

	const uniqueAddresses = new Set<string>();
	for (const h of topHolders) uniqueAddresses.add(h.address);
	for (const l of topLoanAddresses) uniqueAddresses.add(l.borrower);

	const ensMap = await safeQuery(
		() => resolveEnsNames(Array.from(uniqueAddresses) as Address[]),
		new Map<string, string | null>(),
		"resolveEnsNames",
	);

	const topHoldersWithEns = topHolders.map((h) => ({
		...h,
		ensName: ensMap.get(h.address) ?? null,
	}));
	const topLoanAddressesWithEns = topLoanAddresses.map((l) => ({
		...l,
		ensName: ensMap.get(l.borrower) ?? null,
	}));

	const goalTarget = Number(pubEnv.PUBLIC_GOAL_TARGET ?? DEFAULT_GOAL);

	setHeaders({
		"cache-control": "public, s-maxage=60, stale-while-revalidate=300",
	});

	return {
		activeLoans,
		topHolders: topHoldersWithEns,
		topLoanAddresses: topLoanAddressesWithEns,
		goalTarget,
	};
};
