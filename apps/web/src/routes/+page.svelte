<script lang="ts">
	import Banner from "$lib/components/Banner.svelte";
	import GoalsTracker from "$lib/components/GoalsTracker.svelte";
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
		<HolderLeaderboard rows={data.topHolders} />
		<LoanLeaderboard rows={data.topLoanAddresses} />
	</div>
</section>
