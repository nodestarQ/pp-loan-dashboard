<script lang="ts">
	interface Props {
		eyebrow?: string;
		title: string;
		subtitle?: string;
	}
	let { eyebrow = "Pudgy Penguins", title, subtitle }: Props = $props();
</script>

<div
	class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ice-300 to-ice-200 p-6 shadow-huddle-lg md:p-10"
>
	<!-- Snowflake decorations. Decorative only, aria-hidden. -->
	<svg
		aria-hidden="true"
		class="pointer-events-none absolute -top-6 -right-6 h-36 w-36 text-white/50 md:h-48 md:w-48"
		viewBox="0 0 24 24"
		fill="currentColor"
	>
		<path
			d="M12 2v20M2 12h20M4.2 4.2l15.6 15.6M19.8 4.2L4.2 19.8M12 5l-2 2h4l-2-2zm0 14l2-2h-4l2 2zM5 12l2 2v-4l-2 2zm14 0l-2-2v4l2-2z"
			stroke="currentColor"
			stroke-width="1"
			stroke-linecap="round"
		/>
	</svg>
	<svg
		aria-hidden="true"
		class="pointer-events-none absolute bottom-4 right-16 h-20 w-20 text-white/40"
		viewBox="0 0 24 24"
		fill="currentColor"
	>
		<path
			d="M12 2v20M2 12h20M4.2 4.2l15.6 15.6M19.8 4.2L4.2 19.8"
			stroke="currentColor"
			stroke-width="1"
			stroke-linecap="round"
		/>
	</svg>

	<div class="relative">
		{#if eyebrow}
			<p class="text-sm font-bold uppercase tracking-wider text-ice-700">
				{eyebrow}
			</p>
		{/if}
		<h1 class="mt-2 text-3xl font-extrabold text-ink md:text-5xl">
			{title}
		</h1>
		{#if subtitle}
			<p class="mt-3 max-w-xl text-ink/80">{subtitle}</p>
		{/if}
	</div>
</div>
