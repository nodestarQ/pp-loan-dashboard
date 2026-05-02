<script lang="ts">
	import AuthBadge from "$lib/components/AuthBadge.svelte";
	import AuthGate from "$lib/components/AuthGate.svelte";
	import Banner from "$lib/components/Banner.svelte";
	import HealthMeter from "$lib/components/HealthMeter.svelte";
	import HolderLeaderboard from "$lib/components/HolderLeaderboard.svelte";
	import LoanLeaderboard from "$lib/components/LoanLeaderboard.svelte";
	import { deriveHealth } from "$lib/health";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	const DAMAGE_STAGES = 8;
	const damageLevel = $derived(
		Math.min(
			DAMAGE_STAGES,
			Math.max(
				0,
				Math.floor(
					deriveHealth(data.activeLoans, data.goalTarget).damageRatio *
						DAMAGE_STAGES,
				),
			),
		),
	);
</script>

<svelte:head>
	<link
		rel="icon"
		type="image/svg+xml"
		href="/favicons/huddle-{damageLevel}.svg"
	/>
</svelte:head>

<section class="mb-6 md:mb-10">
	<Banner
		title="Huddle Health"
		subtitle="Penguins huddle together when it gets cold. When loans pile up against our collection, the huddle weakens. This dashboard tracks active Pudgy Penguin loans across NFTfi, Arcade, and Blur Blend so the community can rally to bring them back down."
	/>
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

	{#if data.isAuthed && data.topHolders && data.topLoanAddresses}
		{#if data.sessionAddress}
			<div class="md:col-span-2">
				<AuthBadge address={data.sessionAddress} />
			</div>
		{/if}
		<HolderLeaderboard rows={data.topHolders} />
		<LoanLeaderboard rows={data.topLoanAddresses} />
	{:else}
		<div class="md:col-span-2">
			<AuthGate />
		</div>
	{/if}
</section>
