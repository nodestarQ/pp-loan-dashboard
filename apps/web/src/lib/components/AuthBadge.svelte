<script lang="ts">
	import { onMount } from "svelte";

	import { invalidateAll } from "$app/navigation";

	import { logout } from "$lib/auth-client";

	interface Props {
		address: string;
	}
	let { address }: Props = $props();

	let busy = $state(false);

	function shorten(a: string): string {
		if (!a) return "";
		return `${a.slice(0, 6)}…${a.slice(-4)}`;
	}

	async function handleDisconnect() {
		if (busy) return;
		busy = true;
		try {
			await logout();
			await invalidateAll();
		} finally {
			busy = false;
		}
	}

	// Drop the server session as soon as the wallet's connected account
	// changes or empties (user hit "Disconnect" in MetaMask). Without this,
	// the cookie stays valid for 7 days even after the wallet is gone.
	onMount(() => {
		type Ethereum = {
			on?: (event: string, handler: (accounts: string[]) => void) => void;
			removeListener?: (
				event: string,
				handler: (accounts: string[]) => void,
			) => void;
		};
		const eth = (window as unknown as { ethereum?: Ethereum }).ethereum;
		if (!eth?.on) return;
		const handler = (accounts: string[]) => {
			const next = accounts[0]?.toLowerCase();
			if (!next || next !== address.toLowerCase()) {
				void handleDisconnect();
			}
		};
		eth.on("accountsChanged", handler);
		return () => {
			eth.removeListener?.("accountsChanged", handler);
		};
	});
</script>

<div
	class="flex items-center justify-end gap-2 text-xs text-fog md:text-sm"
	role="status"
>
	<span class="font-medium">Connected as</span>
	<span
		class="rounded-full border border-mist bg-white px-2.5 py-1 font-mono text-ink shadow-sm"
		>{shorten(address)}</span
	>
	<button
		type="button"
		onclick={handleDisconnect}
		disabled={busy}
		class="rounded-full border border-mist bg-white px-2.5 py-1 font-semibold text-ink shadow-sm transition hover:bg-ice-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ice-500 disabled:cursor-not-allowed disabled:opacity-60"
	>
		{busy ? "Signing out…" : "Disconnect"}
	</button>
</div>
