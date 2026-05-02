<script lang="ts">
	import { onMount } from "svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	const ogImageUrl = $derived(`${data.origin}/share/health/og.png`);
	const pageUrl = $derived(`${data.origin}/share/health`);
	const description = $derived(
		`${data.rallyText} ${data.snapshot.active} active loans against a ${data.snapshot.goalTarget} target.`,
	);
	const title = $derived(`Huddle Health: ${data.statusLabel}`);

	// Bots scrape the OG meta on first load. Humans clicking the unfurled
	// card get bounced to the live dashboard so they don't land on a
	// near-empty preview page.
	onMount(() => {
		window.location.replace("/");
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImageUrl} />

	<meta http-equiv="refresh" content="0; url=/" />
</svelte:head>

<div
	class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center"
>
	<p class="text-sm font-bold uppercase tracking-wider text-ice-700">
		Pudgy Penguins
	</p>
	<h1 class="text-3xl font-extrabold text-ink">Huddle Health</h1>
	<p class="text-fog">
		Redirecting to the dashboard. <a class="font-bold text-ice-500" href="/"
			>Click here if nothing happens.</a
		>
	</p>
</div>
