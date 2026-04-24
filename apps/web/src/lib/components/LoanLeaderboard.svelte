<script lang="ts">
	import LeaderboardRow from "./LeaderboardRow.svelte";

	interface Profile {
		username: string | null;
		pfpUrl: string | null;
		twitter: string | null;
	}
	interface LoanItem {
		borrower: string;
		locked: number;
		profile?: Profile;
	}

	interface Props {
		rows: LoanItem[];
	}
	let { rows }: Props = $props();

	const PAGE_SIZE = 10;
	let page = $state(0);
	const totalPages = $derived(Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
	const visibleRows = $derived(
		rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
	);
</script>

<div class="rounded-2xl bg-white p-6 shadow-huddle">
	<p class="text-xs font-semibold uppercase tracking-wider text-fog">
		Active Borrowers
	</p>
	<p class="mt-1 text-xs text-fog">
		Most Pudgy Penguins currently locked as collateral.
	</p>
	{#if rows.length === 0}
		<p class="mt-4 text-fog">Indexer has not populated this yet.</p>
	{:else}
		<ol class="mt-4 divide-y divide-mist">
			{#each visibleRows as r, i (r.borrower)}
				<LeaderboardRow
					rank={page * PAGE_SIZE + i + 1}
					address={r.borrower}
					profile={r.profile}
					count={r.locked}
					accent="coral"
				/>
			{/each}
		</ol>
		{#if totalPages > 1}
			<div class="mt-4 flex items-center justify-between text-sm">
				<button
					type="button"
					class="rounded-full px-3 py-1 text-fog transition-colors hover:text-ice-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-fog"
					disabled={page === 0}
					onclick={() => page--}
				>
					← Prev
				</button>
				<span class="text-xs tabular-nums text-fog">
					Page {page + 1} of {totalPages}
				</span>
				<button
					type="button"
					class="rounded-full px-3 py-1 text-fog transition-colors hover:text-ice-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-fog"
					disabled={page === totalPages - 1}
					onclick={() => page++}
				>
					Next →
				</button>
			</div>
		{/if}
	{/if}
</div>
