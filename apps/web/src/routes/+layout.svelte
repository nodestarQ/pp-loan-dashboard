<script lang="ts">
	import SnowParticles from "$lib/components/SnowParticles.svelte";
	import SyncingBanner from "$lib/components/SyncingBanner.svelte";
	import "../app.css";

	let { children } = $props();
</script>

<SnowParticles />
<SyncingBanner />

<div
	class="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10"
>
	{@render children()}
</div>
