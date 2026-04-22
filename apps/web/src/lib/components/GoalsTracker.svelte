<script lang="ts">
	interface Props {
		current: number;
		target: number;
	}
	let { current, target }: Props = $props();

	// Scale the bar so the target marker is always visible even when current
	// is far below or far above the goal.
	const scaleMax = $derived(Math.max(current, target * 1.5, 1));
	const currentPct = $derived((current / scaleMax) * 100);
	const targetPct = $derived((target / scaleMax) * 100);
	const aboveBy = $derived(Math.max(0, current - target));
	const belowBy = $derived(Math.max(0, target - current));
	const atOrBelow = $derived(current <= target);
</script>

<div class="rounded-2xl bg-white p-6 shadow-huddle">
	<p class="text-xs font-semibold uppercase tracking-wider text-fog">
		Community Goal
	</p>

	<p class="mt-3 text-ink">
		Keep active loans at
		<span class="font-bold">{target}</span>
		or fewer. Every repay helps.
	</p>

	<div
		class="relative mt-6 h-4 overflow-hidden rounded-full border border-mist bg-ice-50"
	>
		<div
			class="h-full rounded-full transition-[width] duration-500 ease-out"
			class:bg-ice-300={atOrBelow}
			class:bg-coral={!atOrBelow}
			style="width: {currentPct}%"
		></div>
		<div
			class="absolute top-0 bottom-0 w-[2px] bg-ink/80"
			style="left: {targetPct}%"
			aria-hidden="true"
		></div>
	</div>

	<div class="mt-2 flex justify-between text-xs text-fog">
		<span>0</span>
		<span>Goal: {target}</span>
	</div>

	<p class="mt-4 text-ink">
		{#if atOrBelow}
			<span class="font-bold text-ice-500">Goal reached.</span>
			{belowBy > 0 ? `${belowBy} under target. Hold the line.` : "Hold the line."}
		{:else}
			<span class="font-bold text-coral">{aboveBy}</span> loans over goal.
			Loans on Pudgy Penguins down on X. Every repay counts.
		{/if}
	</p>
</div>
