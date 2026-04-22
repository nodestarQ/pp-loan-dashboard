<script lang="ts">
	import Banner from "$lib/components/Banner.svelte";
	import GoalsTracker from "$lib/components/GoalsTracker.svelte";
	import HealthMeter from "$lib/components/HealthMeter.svelte";
	import Narrative from "$lib/components/Narrative.svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	const shortAddr = (addr: string) =>
		`${addr.slice(0, 6)}…${addr.slice(-4)}`;
</script>

<section class="mb-6 md:mb-10">
	<Banner
		title="Huddle Health"
		subtitle="Loan pressure on the Pudgy Penguins collection, in one place."
	/>
</section>

<section class="mb-6 md:mb-10">
	<Narrative>
		{#snippet children()}
			Penguins huddle together when it gets cold. When loans pile up
			against our collection, the huddle weakens. This dashboard tracks
			active PPG loans across NFTfi, Arcade, and Blur Blend so the
			community can rally to bring them back down.
		{/snippet}
	</Narrative>
</section>

<section class="grid gap-4 md:grid-cols-2 md:gap-6">
	<div class="flex flex-col gap-4 md:gap-6">
		<HealthMeter active={data.activeLoans} />
		<GoalsTracker current={data.activeLoans} target={data.goalTarget} />
	</div>

	<div class="flex flex-col gap-4 md:gap-6">
		<div class="rounded-2xl bg-white p-6 shadow-huddle">
			<p class="text-xs font-semibold uppercase tracking-wider text-fog">
				Top Holders
			</p>
			{#if data.topHolders.length === 0}
				<p class="mt-4 text-fog">Indexer has not populated this yet.</p>
			{:else}
				<ol class="mt-4 divide-y divide-mist">
					{#each data.topHolders as h, i (h.address)}
						<li class="flex items-center justify-between py-2">
							<span class="text-ink">
								<span class="mr-2 font-bold text-fog">{i + 1}.</span>
								{shortAddr(h.address)}
							</span>
							<span class="font-bold text-ice-500">{h.balance}</span>
						</li>
					{/each}
				</ol>
			{/if}
		</div>
		<div class="rounded-2xl bg-white p-6 shadow-huddle">
			<p class="text-xs font-semibold uppercase tracking-wider text-fog">
				Top Loan Addresses
			</p>
			{#if data.topLoanAddresses.length === 0}
				<p class="mt-4 text-fog">Indexer has not populated this yet.</p>
			{:else}
				<ol class="mt-4 divide-y divide-mist">
					{#each data.topLoanAddresses as l, i (l.borrower)}
						<li class="flex items-center justify-between py-2">
							<span class="text-ink">
								<span class="mr-2 font-bold text-fog">{i + 1}.</span>
								{shortAddr(l.borrower)}
							</span>
							<span class="font-bold text-coral">{l.locked}</span>
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	</div>
</section>
