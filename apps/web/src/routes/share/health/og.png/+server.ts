import { renderHealthCardPng } from "$lib/server/og/healthCard";
import { loadHealthSnapshot } from "$lib/server/health-snapshot";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
	const snapshot = await loadHealthSnapshot();
	const png = await renderHealthCardPng(snapshot);

	return new Response(new Uint8Array(png), {
		headers: {
			"content-type": "image/png",
			"cache-control": "public, s-maxage=60, stale-while-revalidate=300",
		},
	});
};
