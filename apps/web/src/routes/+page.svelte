<script lang="ts">
	import Banner from "$lib/components/Banner.svelte";
	import HealthMeter from "$lib/components/HealthMeter.svelte";
	import HolderLeaderboard from "$lib/components/HolderLeaderboard.svelte";
	import LoanLeaderboard from "$lib/components/LoanLeaderboard.svelte";
	import Narrative from "$lib/components/Narrative.svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
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
			active Pudgy Penguin loans across NFTfi, Arcade, and Blur Blend so the
			community can rally to bring them back down.
		{/snippet}
	</Narrative>
</section>

<section class="grid gap-4 md:grid-cols-2 md:gap-6">
	<div class="md:col-span-2">
		<HealthMeter
			active={data.activeLoans}
			borrowers={data.participants.borrowers}
			lenders={data.participants.lenders}
			goalTarget={data.goalTarget}
		/>
	</div>

	<HolderLeaderboard rows={data.topHolders} />
	<LoanLeaderboard rows={data.topLoanAddresses} />
</section>
