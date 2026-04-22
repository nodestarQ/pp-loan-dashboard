<script lang="ts">
	import { onMount } from "svelte";
	import type { SyncStatus } from "../../routes/api/sync-status/+server";

	const POLL_INTERVAL_MS = 5000;

	let status = $state<SyncStatus>({
		ready: true,
		indexerReachable: true,
		indexedBlock: null,
		indexedAt: null,
	});

	async function poll() {
		try {
			const res = await fetch("/api/sync-status");
			if (!res.ok) return;
			status = (await res.json()) as SyncStatus;
		} catch {
			status = {
				ready: false,
				indexerReachable: false,
				indexedBlock: null,
				indexedAt: null,
			};
		}
	}

	onMount(() => {
		poll();
		const id = setInterval(poll, POLL_INTERVAL_MS);
		return () => clearInterval(id);
	});

	const hidden = $derived(status.ready);
	const title = $derived(
		status.indexerReachable ? "Syncing" : "Indexer offline",
	);
	const detail = $derived.by(() => {
		if (!status.indexerReachable) {
			return "Last-known data shown below.";
		}
		if (status.indexedBlock) {
			return `Caught up to block ${status.indexedBlock.toLocaleString()}.`;
		}
		return "Waiting for the indexer to start ingesting.";
	});
</script>

{#if !hidden}
	<div
		role="status"
		aria-live="polite"
		class="sticky top-0 z-30 border-b border-mustard/30 bg-mustard/90 backdrop-blur"
	>
		<div
			class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-sm text-ink md:px-8"
		>
			<span
				class="inline-block h-2.5 w-2.5 flex-shrink-0 animate-pulse rounded-full bg-ink"
				aria-hidden="true"
			></span>
			<span class="font-bold">{title}.</span>
			<span class="text-ink/80">{detail}</span>
		</div>
	</div>
{/if}
