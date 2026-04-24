<script lang="ts">
	import { PPG_TOTAL_SUPPLY } from "@pp/shared";

	import PainguClicker from "./PainguClicker.svelte";

	interface Props {
		active: number;
		borrowers: number;
		lenders: number;
		goalTarget: number;
		total?: number;
	}
	let {
		active,
		borrowers,
		lenders,
		goalTarget,
		total = PPG_TOTAL_SUPPLY,
	}: Props = $props();

	const pct = $derived(Math.min(100, Math.max(0, (active / total) * 100)));

	const statusLabel = $derived(
		pct < 2 ? "Strong" : pct < 5 ? "Steady" : pct < 10 ? "Warming" : "Hot",
	);
	const statusColor = $derived(
		pct < 5 ? "text-ice-500" : pct < 10 ? "text-mustard" : "text-coral",
	);

	// Goal progress. Right edge = whichever is larger of active vs goal,
	// so the threshold line stays on-screen at all times:
	//   - active > goal: right edge is active; goal line sits inside and
	//     moves LEFT as active grows (more loans → line further left).
	//   - active ≤ goal: right edge is goal; goal line pins to the right
	//     and the fill end shows where active currently sits.
	const scaleMax = $derived(Math.max(active, goalTarget, 1));
	const currentPct = $derived((active / scaleMax) * 100);
	const targetPct = $derived((goalTarget / scaleMax) * 100);
	const aboveBy = $derived(Math.max(0, active - goalTarget));
	const belowBy = $derived(Math.max(0, goalTarget - active));
	const atOrBelowGoal = $derived(active <= goalTarget);

	// Danger-zone gradient: healthy green at zero, amber at the goal marker,
	// deep red at the right edge. The gradient is defined in track-relative
	// percentages and the fill element enlarges it via background-size so
	// the colour visible at any point maps to that point's position on the
	// full track — i.e. a 50%-full bar shows the left half of the gradient,
	// not the gradient squished into 50% width.
	const fillGradient = $derived(
		`linear-gradient(to right, #10B981 0%, #F59E0B ${targetPct}%, #DC2626 100%)`,
	);
	const fillBgSize = $derived(
		currentPct > 0 ? `${(10000 / currentPct).toFixed(2)}% 100%` : "100% 100%",
	);
</script>

<div class="rounded-2xl bg-white p-6 shadow-huddle">
	<p class="text-xs font-semibold uppercase tracking-wider text-fog">
		Huddle Health
	</p>

	<div
		class="mt-6 grid grid-cols-1 divide-y divide-mist md:grid-cols-3 md:divide-x md:divide-y-0"
	>
		<div class="py-4 text-center md:py-0 md:pr-6">
			<p class="text-5xl font-extrabold tabular-nums text-ink">{active}</p>
			<p class="mt-1 text-xs font-semibold uppercase tracking-wider text-fog">
				Active Pudgy Penguin Loans
			</p>
			<p class="mt-2 text-sm text-ink">
				<span class="font-bold">{pct.toFixed(2)}%</span> of supply
				<span
					class="ml-2 text-xs font-semibold uppercase tracking-wider {statusColor}"
				>
					{statusLabel}
				</span>
			</p>
		</div>
		<div class="py-4 text-center md:px-6 md:py-0">
			<p class="text-5xl font-extrabold tabular-nums text-ink">{borrowers}</p>
			<p class="mt-1 text-xs font-semibold uppercase tracking-wider text-fog">
				Unique Borrowers
			</p>
		</div>
		<div class="py-4 text-center md:py-0 md:pl-6">
			<p class="text-5xl font-extrabold tabular-nums text-ink">{lenders}</p>
			<p class="mt-1 text-xs font-semibold uppercase tracking-wider text-fog">
				Unique Lenders
			</p>
		</div>
	</div>

	<div class="my-6 h-px bg-mist" aria-hidden="true"></div>

	<div class="text-center">
		<PainguClicker />

		<p class="mt-4 text-ink">
			Below <span class="font-bold">{goalTarget}</span> keeps the huddle whole.
			<span class="font-bold">Zero</span> is full strength.
		</p>

		<div class="mx-auto mt-4 max-w-xl">
			<div
				class="relative h-4 overflow-hidden rounded-full border border-mist bg-ice-50"
			>
				<div
					class="h-full rounded-full transition-[width] duration-500 ease-out"
					style="width: {currentPct}%; background-image: {fillGradient}; background-size: {fillBgSize}; background-position: 0 0;"
				></div>
				<div
					class="absolute top-0 bottom-0 w-[2px] bg-ink/80"
					style="left: {targetPct}%"
					aria-hidden="true"
				></div>
			</div>

			<div class="relative mt-2 h-4 text-xs">
				<span class="absolute left-0 top-0 tabular-nums text-fog">0</span>
				<span
					class="absolute top-0 tabular-nums text-fog"
					style="left: {targetPct}%; transform: translateX(-50%);"
				>
					{goalTarget}
				</span>
				{#if active !== goalTarget}
					<span
						class="absolute top-0 tabular-nums font-semibold text-ink"
						style="left: {currentPct}%; transform: translateX(-50%);"
					>
						{active}
					</span>
				{/if}
			</div>
		</div>

		<p class="mt-3 text-sm text-ink">
			{#if atOrBelowGoal}
				<span class="font-bold text-ice-500">Huddle holds.</span>
				{belowBy > 0 ? `${belowBy} under the line.` : ""}
			{:else}
				<span class="font-bold text-coral">{aboveBy}</span>
				over the line. Rally the huddle.
			{/if}
		</p>
	</div>
</div>
