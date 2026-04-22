<script lang="ts">
	import LeaderboardRow from "./LeaderboardRow.svelte";

	interface HolderItem {
		address: string;
		balance: number;
		ensName?: string | null;
	}

	interface Props {
		rows: HolderItem[];
	}
	let { rows }: Props = $props();
</script>

<div class="rounded-2xl bg-white p-6 shadow-huddle">
	<p class="text-xs font-semibold uppercase tracking-wider text-fog">
		Top Holders
	</p>
	<p class="mt-1 text-xs text-fog">Diamond-flipper huddle.</p>
	{#if rows.length === 0}
		<p class="mt-4 text-fog">Indexer has not populated this yet.</p>
	{:else}
		<ol class="mt-4 divide-y divide-mist">
			{#each rows as r, i (r.address)}
				<LeaderboardRow
					rank={i + 1}
					address={r.address}
					ensName={r.ensName}
					count={r.balance}
					accent="ice"
				/>
			{/each}
		</ol>
	{/if}
</div>
