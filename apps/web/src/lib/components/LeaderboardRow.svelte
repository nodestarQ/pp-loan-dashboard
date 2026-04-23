<script lang="ts">
	interface Profile {
		username: string | null;
		pfpUrl: string | null;
		twitter: string | null;
	}
	interface Props {
		rank: number;
		address: string;
		profile?: Profile;
		count: number;
		accent?: "ice" | "coral";
	}
	let {
		rank,
		address,
		profile,
		count,
		accent = "ice",
	}: Props = $props();

	const shortAddr = $derived(`${address.slice(0, 6)}…${address.slice(-4)}`);
	const label = $derived(profile?.username ?? shortAddr);
	const etherscan = $derived(`https://etherscan.io/address/${address}`);
	const twitter = $derived(profile?.twitter ?? null);
	const twitterUrl = $derived(twitter ? `https://x.com/${twitter}` : null);
	const openseaUrl = $derived(
		profile?.username ? `https://opensea.io/${profile.username}` : null,
	);
</script>

<li class="flex items-center justify-between gap-3 py-2.5">
	<div class="flex min-w-0 items-center gap-3">
		<span class="w-7 flex-shrink-0 text-right font-bold tabular-nums text-fog">
			{rank}.
		</span>
		<img
			src={profile?.pfpUrl ?? "/profile.svg"}
			alt=""
			class="h-8 w-8 flex-shrink-0 rounded-full bg-mist object-cover"
			loading="lazy"
			aria-hidden="true"
		/>
		<div class="flex min-w-0 flex-col gap-1 leading-tight">
			<a
				href={etherscan}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex min-w-0 items-center gap-1 text-ink transition-colors hover:text-ice-500"
				title="View {address} on Etherscan"
			>
				<span class="truncate">{label}</span>
				<svg
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-3 w-3 flex-shrink-0 opacity-50"
					aria-hidden="true"
				>
					<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
				</svg>
			</a>
			{#if twitterUrl || openseaUrl}
				<div class="flex flex-wrap items-center gap-1.5">
					{#if twitterUrl}
						<a
							href={twitterUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
							title="Open @{twitter} on X"
						>
							<svg
								viewBox="0 0 1200 1227"
								xmlns="http://www.w3.org/2000/svg"
								class="h-2.5 w-2.5 flex-shrink-0 fill-current"
								aria-hidden="true"
							>
								<path
									d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.854Z"
								/>
							</svg>
							<span class="truncate">@{twitter}</span>
						</a>
					{/if}
					{#if openseaUrl}
						<a
							href={openseaUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-[#2081E2] px-2 py-0.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
							title="Open {profile?.username} on OpenSea"
						>
							<svg
								viewBox="0 0 90 90"
								xmlns="http://www.w3.org/2000/svg"
								class="h-3 w-3 flex-shrink-0 fill-current"
								aria-hidden="true"
							>
								<path
									d="M22.203 46.52 22.396 46.22 34.031 28.03c.17-.265.573-.236.697.058 1.944 4.355 3.62 9.77 2.834 13.142-.334 1.384-1.25 3.256-2.283 4.982a10.638 10.638 0 0 1-.623.961c-.093.13-.245.205-.408.205H22.55c-.393 0-.621-.426-.347-.851Z"
								/>
								<path
									d="M74.375 48.995v2.908c0 .167-.103.315-.255.376-.921.392-4.073 1.831-5.382 3.647-3.339 4.629-5.884 11.24-11.566 11.24H34.234C25.837 67.166 19 60.31 19 51.889v-.269c0-.222.18-.403.402-.403h13.001c.26 0 .451.239.427.494-.095.854.065 1.725.472 2.516.788 1.606 2.43 2.609 4.201 2.609h6.435V51.807h-6.362c-.324 0-.517-.376-.329-.64.07-.104.146-.211.228-.33.587-.837 1.428-2.141 2.263-3.623.571-.998 1.125-2.063 1.57-3.133.088-.194.161-.392.234-.585.122-.331.246-.638.335-.944.09-.26.163-.535.235-.798.218-.946.31-1.947.31-2.985 0-.408-.019-.837-.054-1.244-.016-.447-.072-.897-.125-1.348-.039-.401-.109-.807-.182-1.221-.091-.61-.219-1.216-.366-1.825l-.051-.226c-.112-.407-.21-.793-.339-1.2-.362-1.266-.78-2.5-1.22-3.648-.163-.458-.347-.892-.531-1.33-.271-.652-.548-1.244-.798-1.802-.129-.257-.237-.491-.346-.732-.124-.27-.25-.541-.379-.798-.092-.2-.196-.388-.273-.575l-.83-1.533c-.118-.211.08-.462.315-.396l4.918 1.334h.014c.009 0 .013.004.019.004l.647.183.712.205.261.074v-2.924c0-1.411 1.128-2.554 2.523-2.554.696 0 1.329.284 1.782.748.456.464.742 1.1.742 1.806v4.26l.524.146c.041.014.082.032.12.059.129.096.313.236.548.41.184.147.382.325.621.516.474.383 1.04.874 1.66 1.437.165.143.325.287.472.43.798.742 1.691 1.612 2.542 2.574.237.271.472.546.709.832.236.292.487.577.706.862.288.382.598.781.87 1.202.129.198.28.401.404.599.351.531.66 1.083.956 1.631.125.255.253.531.364.805.326.731.584 1.475.748 2.221.05.16.087.334.105.49v.038c.055.221.073.456.091.697.073.769.037 1.538-.127 2.313-.069.328-.162.639-.271.97-.11.316-.22.646-.356.959-.265.614-.577 1.228-.943 1.802-.124.218-.271.45-.415.668-.156.233-.317.456-.462.674-.2.272-.413.556-.631.813-.194.269-.393.535-.608.769-.301.356-.594.691-.897 1.006-.185.216-.378.435-.582.632-.2.22-.404.416-.589.596-.31.309-.57.55-.787.748l-.51.468c-.074.064-.172.1-.274.1H48.861v5.342h5.019c1.126 0 2.198-.398 3.062-1.13.296-.259 1.585-1.37 3.11-3.046.05-.056.117-.094.191-.113l13.61-3.935c.233-.068.522.112.522.383Z"
								/>
							</svg>
							<span class="truncate">OpenSea</span>
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</div>
	<span
		class="flex-shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums"
		class:bg-ice-100={accent === "ice"}
		class:text-ice-700={accent === "ice"}
		class:bg-coral={accent === "coral"}
		class:text-white={accent === "coral"}
	>
		{count}
	</span>
</li>
