import { PPG_TOTAL_SUPPLY } from "@pp/shared";

export type RallyTone = "win" | "warn" | "lose";

export interface HealthDerivation {
	pct: number;
	statusLabel: "Healthy" | "Stable" | "Strained" | "Critical";
	statusColor: string;
	rallyText: string;
	rallyTone: RallyTone;
	rallyToneColor: string;
	currentPct: number;
	targetPct: number;
	damageRatio: number;
	aboveBy: number;
	belowBy: number;
	fillGradient: string;
	fillBgSize: string;
}

const TONE_COLORS: Record<RallyTone, string> = {
	win: "#1e8acb",
	warn: "#f4b740",
	lose: "#ff8a65",
};

export function deriveHealth(
	active: number,
	goalTarget: number,
	total: number = PPG_TOTAL_SUPPLY,
): HealthDerivation {
	const pct = Math.min(100, Math.max(0, (active / total) * 100));

	const goalProgress = goalTarget > 0 ? active / goalTarget : 0;
	const statusLabel =
		goalProgress < 0.25
			? "Healthy"
			: goalProgress < 0.6
				? "Stable"
				: goalProgress < 1
					? "Strained"
					: "Critical";
	const statusColor =
		goalProgress < 0.6 ? "#1e8acb" : goalProgress < 1 ? "#f4b740" : "#ff8a65";

	const scaleMax = Math.max(active, goalTarget, 1);
	const currentPct = (active / scaleMax) * 100;
	const targetPct = (goalTarget / scaleMax) * 100;

	const damageRatio = goalTarget > 0 ? Math.min(1, active / goalTarget) : 0;
	const aboveBy = Math.max(0, active - goalTarget);
	const belowBy = Math.max(0, goalTarget - active);

	const { rallyText, rallyTone } = deriveRally(active, goalTarget);

	const fillGradient = `linear-gradient(to right, #10B981 0%, #F59E0B ${targetPct}%, #DC2626 100%)`;
	const fillBgSize =
		currentPct > 0 ? `${(10000 / currentPct).toFixed(2)}% 100%` : "100% 100%";

	return {
		pct,
		statusLabel,
		statusColor,
		rallyText,
		rallyTone,
		rallyToneColor: TONE_COLORS[rallyTone],
		currentPct,
		targetPct,
		damageRatio,
		aboveBy,
		belowBy,
		fillGradient,
		fillBgSize,
	};
}

function deriveRally(
	active: number,
	goalTarget: number,
): { rallyText: string; rallyTone: RallyTone } {
	if (active === 0)
		return { rallyTone: "win", rallyText: "We made it. This is PENGTOPIA." };
	if (active === goalTarget)
		return {
			rallyTone: "warn",
			rallyText: "Dead tie. The HUDDLE must push back.",
		};
	const ratio = goalTarget > 0 ? active / goalTarget : 0;
	if (ratio < 0.25)
		return {
			rallyTone: "win",
			rallyText: "The HUDDLE is thriving. Stay warm, stay tight.",
		};
	if (ratio < 0.6)
		return {
			rallyTone: "win",
			rallyText: "The HUDDLE is strong. Keep it close.",
		};
	if (ratio < 0.85)
		return {
			rallyTone: "warn",
			rallyText: "The HUDDLE is strained. Hold the line.",
		};
	if (ratio < 1)
		return {
			rallyTone: "warn",
			rallyText: "Almost there, PENGUINS. Do not break now!",
		};
	if (ratio < 1.2)
		return {
			rallyTone: "lose",
			rallyText: "The HUDDLE is cracking. Rally, NOW!",
		};
	if (ratio < 1.5)
		return {
			rallyTone: "lose",
			rallyText: "BERAS are pushing through. HUDDLE up!",
		};
	return {
		rallyTone: "lose",
		rallyText: "The HUDDLE is in bad condition. RIOT!",
	};
}
