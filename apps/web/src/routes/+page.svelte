<script lang="ts">
	import { PPG_TOTAL_SUPPLY } from "@pp/shared";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	const shortAddr = (addr: string) =>
		`${addr.slice(0, 6)}…${addr.slice(-4)}`;
	const pctInLoans = $derived((data.activeLoans / PPG_TOTAL_SUPPLY) * 100);
</script>

<section class="mb-6 md:mb-10">
	<div class="rounded-3xl bg-ice-300 p-6 shadow-huddle-lg md:p-10">
		<p class="text-sm font-bold uppercase tracking-wider text-ice-700">
			Pudgy Penguins
		</p>
		<h1 class="mt-2 text-3xl font-extrabold text-ink md:text-5xl">
			Huddle Health
		</h1>
		<p class="mt-3 max-w-xl text-ink/80">
			Loan pressure on the collection, in one place.
		</p>
	</div>
</section>

<section class="mb-6 md:mb-10">
	<div class="rounded-2xl bg-white p-6 shadow-huddle md:p-8">
		<p class="leading-relaxed text-ink">
			Penguins huddle together when it gets cold. When loans pile up against
			our collection, the huddle weakens. This dashboard tracks active PPG
			loans across NFTfi, Arcade, and Blur Blend so the community can rally
			to bring them back down.
		</p>
	</div>
</section>

<section class="grid gap-4 md:grid-cols-2 md:gap-6">
	<div class="flex flex-col gap-4 md:gap-6">
		<div class="rounded-2xl bg-white p-6 shadow-huddle">
			<p class="text-xs font-semibold uppercase tracking-wider text-fog">
				Active PPG loans
			</p>
			<p class="mt-4 text-6xl font-extrabold text-ice-500">
				{data.activeLoans}
			</p>
			<p class="mt-2 text-fog">
				{pctInLoans.toFixed(2)}% of the 8,888 supply. Phase 10 turns this
				into a proper meter.
			</p>
		</div>
		<div class="rounded-2xl bg-white p-6 shadow-huddle">
			<p class="text-xs font-semibold uppercase tracking-wider text-fog">
				Community Goal
			</p>
			<p class="mt-4 text-ink">
				Target: <span class="font-bold">{data.goalTarget}</span> active loans
				or fewer. Goals tracker lands in phase 10.
			</p>
		</div>
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
