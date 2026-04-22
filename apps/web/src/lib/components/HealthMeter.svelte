<script lang="ts">
	import { PPG_TOTAL_SUPPLY } from "@pp/shared";

	interface Props {
		active: number;
		total?: number;
	}
	let { active, total = PPG_TOTAL_SUPPLY }: Props = $props();

	const ratio = $derived(Math.min(1, Math.max(0, active / total)));
	const pct = $derived(ratio * 100);

	// Thermometer geometry: tube y 15..220 (height 205), bulb cy 230 r 25.
	const TUBE_TOP = 15;
	const TUBE_BOTTOM = 220;
	const TUBE_HEIGHT = TUBE_BOTTOM - TUBE_TOP;
	const fillHeight = $derived(ratio * TUBE_HEIGHT);
	const fillTop = $derived(TUBE_BOTTOM - fillHeight);

	const statusLabel = $derived(
		pct < 2 ? "Strong" : pct < 5 ? "Steady" : pct < 10 ? "Warming" : "Hot",
	);
	const statusColor = $derived(
		pct < 5 ? "text-ice-500" : pct < 10 ? "text-mustard" : "text-coral",
	);
</script>

<div class="rounded-2xl bg-white p-6 shadow-huddle">
	<p class="text-xs font-semibold uppercase tracking-wider text-fog">
		Huddle Health
	</p>

	<div class="mt-6 flex items-center gap-6">
		<svg
			viewBox="0 0 80 260"
			class="h-56 w-20 flex-shrink-0"
			aria-label="Active loans thermometer"
			role="img"
		>
			<defs>
				<linearGradient id="fill-gradient" x1="0" y1="1" x2="0" y2="0">
					<stop offset="0%" stop-color="#7FD0F5" />
					<stop offset="60%" stop-color="#F4B740" />
					<stop offset="100%" stop-color="#FF8A65" />
				</linearGradient>
			</defs>

			<!-- Bulb (always filled, acts as reservoir). -->
			<circle
				cx="40"
				cy="230"
				r="25"
				fill="#E6F4FC"
				stroke="#C9DCE8"
				stroke-width="2"
			/>
			<circle cx="40" cy="230" r="20" fill="url(#fill-gradient)" />

			<!-- Tube (outline). -->
			<rect
				x="30"
				y={TUBE_TOP}
				width="20"
				height={TUBE_HEIGHT}
				rx="10"
				ry="10"
				fill="#E6F4FC"
				stroke="#C9DCE8"
				stroke-width="2"
			/>

			<!-- Tube fill (grows from bottom). -->
			{#if fillHeight > 0}
				<rect
					x="34"
					y={fillTop}
					width="12"
					height={fillHeight}
					rx="6"
					ry="6"
					fill="url(#fill-gradient)"
				/>
			{/if}
		</svg>

		<div>
			<p class="text-6xl font-extrabold tabular-nums text-ink">{active}</p>
			<p class="mt-1 text-fog">active PPG loans</p>
			<p class="mt-3 text-sm text-ink">
				<span class="font-bold">{pct.toFixed(2)}%</span> of the
				{total.toLocaleString()} supply
			</p>
			<p
				class="mt-2 text-sm font-semibold uppercase tracking-wider {statusColor}"
			>
				{statusLabel}
			</p>
		</div>
	</div>
</div>
