import { env as pubEnv } from "$env/dynamic/public";

import {
	getActiveLoanCount,
	getActiveParticipantCounts,
	safeQuery,
} from "./db/queries";

const DEFAULT_GOAL = 130;

export interface HealthSnapshot {
	active: number;
	borrowers: number;
	lenders: number;
	goalTarget: number;
}

export async function loadHealthSnapshot(): Promise<HealthSnapshot> {
	const [active, participants] = await Promise.all([
		safeQuery(() => getActiveLoanCount(), 0, "activeLoanCount"),
		safeQuery(
			() => getActiveParticipantCounts(),
			{ borrowers: 0, lenders: 0 },
			"activeParticipantCounts",
		),
	]);

	const goalTarget = Number(pubEnv.PUBLIC_GOAL_TARGET ?? DEFAULT_GOAL);

	return {
		active,
		borrowers: participants.borrowers,
		lenders: participants.lenders,
		goalTarget,
	};
}
