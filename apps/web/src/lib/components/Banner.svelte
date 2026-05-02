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
	<div class="relative">
		{#if eyebrow}
			<p class="text-sm font-bold uppercase tracking-wider text-ice-700">
				{eyebrow}
			</p>
		{/if}
		<h1
			class="mt-2 text-3xl font-extrabold text-white md:text-5xl"
			style="-webkit-text-stroke: 5px #0b1b2a; paint-order: stroke fill;"
		>
			{title}
		</h1>
		{#if subtitle}
			<p class="mt-3 text-ink/80">{subtitle}</p>
		{/if}
	</div>
</div>
