<script lang="ts">
	import { PPG_TOTAL_SUPPLY } from "@pp/shared";
	import { dev } from "$app/environment";

	import { deriveHealth } from "$lib/health";
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

	// Debug override: when `debugEnabled` is on, the slider value stands in
	// for `active` through every downstream derivation (big number, bar,
	// damage ratio) so the whole loans → damage pipeline can be exercised
	// end-to-end without real chain data. While debug is off, the slider
	// tracks the real `active` value so flipping it on starts from the
	// current count rather than snapping to 0.
	let debugEnabled = $state(false);
	let debugActive = $state(active);
	$effect(() => {
		if (!debugEnabled) debugActive = active;
	});
	const effectiveActive = $derived(debugEnabled ? debugActive : active);

	const h = $derived(deriveHealth(effectiveActive, goalTarget, total));

	function shareToX() {
		const origin = window.location.origin;
		const url = `${origin}/share/health`;
		const text = `there are ${active} active Pudgy Penguin Loans 🐧`;
		const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
		window.open(intent, "_blank", "noopener,noreferrer");
	}
</script>

<div class="relative rounded-2xl bg-white p-6 pb-14 shadow-huddle md:pb-6">
	<p class="text-xs font-semibold uppercase tracking-wider text-fog">
		Huddle Health
	</p>

	<div class="mt-6 grid grid-cols-3 divide-x divide-mist">
		<div class="px-2 py-2 text-center md:py-0 md:pr-6">
			<p class="text-3xl font-extrabold tabular-nums text-ink md:text-5xl">
				{borrowers}
			</p>
			<p class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-fog md:text-xs">
				Borrowers
			</p>
		</div>
		<div class="px-2 py-2 text-center md:px-6 md:py-0">
			<p class="text-3xl font-extrabold tabular-nums text-ink md:text-5xl">
				{effectiveActive}
			</p>
			<p class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-fog md:text-xs">
				Active Loans
			</p>
			<p class="mt-2 hidden text-xs text-ink md:block md:text-sm">
				<span class="font-bold">{h.pct.toFixed(2)}%</span> of supply
				<span
					class="ml-1 text-[10px] font-semibold uppercase tracking-wider md:ml-2 md:text-xs"
					style="color: {h.statusColor};"
				>
					{h.statusLabel}
				</span>
			</p>
		</div>
		<div class="px-2 py-2 text-center md:py-0 md:pl-6">
			<p class="text-3xl font-extrabold tabular-nums text-ink md:text-5xl">
				{lenders}
			</p>
			<p class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-fog md:text-xs">
				Lenders
			</p>
		</div>
	</div>

	<div class="my-6 h-px bg-mist" aria-hidden="true"></div>

	<div class="text-center">
		<PainguClicker damageRatio={h.damageRatio} />

		<p class="mt-4 text-ink">
			<span class="font-bold" style="color: {h.rallyToneColor};"
				>{h.rallyText}</span
			>
			{#if h.aboveBy > 0}
				<span class="text-fog">· {h.aboveBy} over the line</span>
			{:else if h.belowBy > 0}
				<span class="text-fog">· {h.belowBy} under the line</span>
			{/if}
		</p>

		<div class="mx-auto mt-4 max-w-xl">
			<div
				class="relative h-4 overflow-hidden rounded-full border border-mist bg-ice-50"
			>
				<div
					class="h-full rounded-full transition-[width] duration-500 ease-out"
					style="width: {h.currentPct}%; background-image: {h.fillGradient}; background-size: {h.fillBgSize}; background-position: 0 0;"
				></div>
				<div
					class="absolute top-0 bottom-0 w-[2px] bg-ink/80"
					style="left: {h.targetPct}%"
					aria-hidden="true"
				></div>
			</div>

			<div class="relative mt-2 h-4 text-xs">
				<span class="absolute left-0 top-0 tabular-nums text-fog">0</span>
				<span
					class="absolute top-0 tabular-nums text-fog"
					style="left: {h.targetPct}%; transform: translateX(-50%);"
				>
					{goalTarget}
				</span>
				{#if effectiveActive !== goalTarget}
					<span
						class="absolute top-0 tabular-nums font-semibold text-ink"
						style="left: {h.currentPct}%; transform: translateX(-50%);"
					>
						{effectiveActive}
					</span>
				{/if}
			</div>
		</div>

		{#if dev}
		<div
			class="mx-auto mt-6 hidden max-w-xl rounded-lg border border-dashed border-mist p-3 text-left text-xs md:block"
		>
			<label class="flex items-center gap-2 font-mono text-fog">
				<input type="checkbox" bind:checked={debugEnabled} />
				debug: override active loans
			</label>
			<div class="mt-3 flex items-center gap-3" class:opacity-40={!debugEnabled}>
				<input
					type="range"
					min="0"
					max={active}
					step="1"
					bind:value={debugActive}
					disabled={!debugEnabled}
					class="flex-1"
				/>
				<span class="w-20 shrink-0 text-right font-mono tabular-nums text-fog">
					{debugActive} / {active}
				</span>
			</div>
		</div>
		{/if}
	</div>

	<button
		type="button"
		onclick={shareToX}
		class="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white shadow-huddle transition hover:bg-ice-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ice-500 focus-visible:ring-offset-2"
		aria-label="Share Huddle Health on X"
	>
		<svg
			viewBox="0 0 24 24"
			width="14"
			height="14"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				d="M18.244 2H21l-6.522 7.45L22 22h-6.078l-4.766-6.231L5.6 22H2.84l6.97-7.96L2 2h6.226l4.31 5.69L18.244 2Zm-2.13 18.4h1.69L7.97 3.5H6.157l9.957 16.9Z"
			/>
		</svg>
		Share
	</button>
</div>
