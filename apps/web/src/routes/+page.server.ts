import { env as pubEnv } from "$env/dynamic/public";
import {
	getActiveLoanCount,
	getTopHolders,
	getTopLoanAddresses,
	safeQuery,
} from "$lib/server/db/queries";
import type { PageServerLoad } from "./$types";

const DEFAULT_GOAL = 100;

export const load: PageServerLoad = async ({ setHeaders }) => {
	const [activeLoans, topHolders, topLoanAddresses] = await Promise.all([
		safeQuery(() => getActiveLoanCount(), 0, "activeLoanCount"),
		safeQuery(() => getTopHolders(20), [], "topHolders"),
		safeQuery(() => getTopLoanAddresses(20), [], "topLoanAddresses"),
	]);

	const goalTarget = Number(pubEnv.PUBLIC_GOAL_TARGET ?? DEFAULT_GOAL);

	setHeaders({
		"cache-control": "public, s-maxage=60, stale-while-revalidate=300",
	});

	return {
		activeLoans,
		topHolders,
		topLoanAddresses,
		goalTarget,
	};
};
