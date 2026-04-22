<script lang="ts">
	interface Props {
		rank: number;
		address: string;
		ensName?: string | null;
		count: number;
		accent?: "ice" | "coral";
	}
	let {
		rank,
		address,
		ensName = null,
		count,
		accent = "ice",
	}: Props = $props();

	const shortAddr = $derived(`${address.slice(0, 6)}…${address.slice(-4)}`);
	const label = $derived(ensName ?? shortAddr);
	const etherscan = $derived(`https://etherscan.io/address/${address}`);
</script>

<li class="flex items-center justify-between gap-3 py-2.5">
	<div class="flex min-w-0 items-center gap-3">
		<span class="w-7 flex-shrink-0 text-right font-bold tabular-nums text-fog">
			{rank}.
		</span>
		<a
			href={etherscan}
			target="_blank"
			rel="noopener noreferrer"
			class="truncate text-ink transition-colors hover:text-ice-500"
			title={address}
		>
			{label}
		</a>
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
