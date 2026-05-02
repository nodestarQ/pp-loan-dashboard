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
</script>

{#if !hidden}
	<div
		role="status"
		aria-live="polite"
		class="fixed bottom-3 right-3 z-30 flex items-center gap-2 rounded-full border border-mist bg-white/90 px-3 py-1 text-xs text-fog shadow-sm backdrop-blur"
	>
		<span
			class="inline-block h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full"
			class:bg-fog={status.indexerReachable}
			class:bg-coral={!status.indexerReachable}
			aria-hidden="true"
		></span>
		<span>{title}</span>
	</div>
{/if}
