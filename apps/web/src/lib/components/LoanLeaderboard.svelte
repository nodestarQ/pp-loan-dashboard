<script lang="ts">
	import LeaderboardRow from "./LeaderboardRow.svelte";

	interface LoanItem {
		borrower: string;
		locked: number;
		ensName?: string | null;
	}

	interface Props {
		rows: LoanItem[];
	}
	let { rows }: Props = $props();
</script>

<div class="rounded-2xl bg-white p-6 shadow-huddle">
	<p class="text-xs font-semibold uppercase tracking-wider text-fog">
		Top Loan Addresses
	</p>
	<p class="mt-1 text-xs text-fog">
		Most PPG currently locked as collateral.
	</p>
	{#if rows.length === 0}
		<p class="mt-4 text-fog">Indexer has not populated this yet.</p>
	{:else}
		<ol class="mt-4 divide-y divide-mist">
			{#each rows as r, i (r.borrower)}
				<LeaderboardRow
					rank={i + 1}
					address={r.borrower}
					ensName={r.ensName}
					count={r.locked}
					accent="coral"
				/>
			{/each}
		</ol>
	{/if}
</div>
