import { loadHealthSnapshot } from "$lib/server/health-snapshot";
import { deriveHealth } from "$lib/health";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const snapshot = await loadHealthSnapshot();
	const h = deriveHealth(snapshot.active, snapshot.goalTarget);

	setHeaders({
		"cache-control": "public, s-maxage=60, stale-while-revalidate=300",
	});

	return {
		snapshot,
		statusLabel: h.statusLabel,
		rallyText: h.rallyText,
		origin: url.origin,
	};
};
