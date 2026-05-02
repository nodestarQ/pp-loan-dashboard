<script lang="ts">
	import { invalidateAll } from "$app/navigation";

	import { AuthError, connectAndSignIn } from "$lib/auth-client";

	type State = "idle" | "working" | "denied" | "error";

	let phase = $state<State>("idle");
	let errorMsg = $state("");
	let deniedAddress = $state("");

	async function handleConnect() {
		phase = "working";
		errorMsg = "";
		try {
			await connectAndSignIn();
			await invalidateAll();
		} catch (e) {
			if (e instanceof AuthError && e.reason === "not_whitelisted") {
				phase = "denied";
				deniedAddress = e.address ?? "";
				return;
			}
			phase = "error";
			errorMsg =
				e instanceof Error
					? e.message
					: "Something went wrong. Please try again.";
		}
	}

	function reset() {
		phase = "idle";
		errorMsg = "";
		deniedAddress = "";
	}

	function shorten(addr: string): string {
		if (!addr) return "";
		return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
	}
</script>

<div
	class="rounded-2xl bg-white p-8 text-center shadow-huddle md:p-12"
	role="region"
	aria-label="Sign in required"
>
	{#if phase === "denied"}
		<p class="text-xs font-semibold uppercase tracking-wider text-coral">
			Access denied
		</p>
		<h2 class="mt-2 text-2xl font-extrabold text-ink md:text-3xl">
			This wallet is not authorized.
		</h2>
		{#if deniedAddress}
			<p class="mt-2 font-mono text-sm text-fog">{shorten(deniedAddress)}</p>
		{/if}
		<p class="mx-auto mt-3 max-w-md text-sm text-fog">
			Holder and borrower data is restricted. Switch to a whitelisted wallet
			and try again.
		</p>
		<button
			type="button"
			onclick={reset}
			class="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-sm font-bold text-white shadow-huddle transition hover:bg-ice-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ice-500 focus-visible:ring-offset-2"
		>
			Try another wallet
		</button>
	{:else}
		<p class="text-xs font-semibold uppercase tracking-wider text-fog">
			Restricted view
		</p>

		<button
			type="button"
			onclick={handleConnect}
			disabled={phase === "working"}
			class="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white shadow-huddle transition hover:bg-ice-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ice-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{#if phase === "working"}
				<span
					class="inline-block h-3 w-3 animate-pulse rounded-full bg-white/80"
					aria-hidden="true"
				></span>
				Waiting for wallet…
			{:else}
				Connect &amp; sign in
			{/if}
		</button>

		{#if phase === "error" && errorMsg}
			<p class="mt-4 text-sm text-coral">{errorMsg}</p>
		{/if}
	{/if}
</div>
