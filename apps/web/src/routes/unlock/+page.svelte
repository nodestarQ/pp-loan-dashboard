<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData } from "./$types";

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Early Access · Huddle Health</title>
</svelte:head>

<div
	class="mx-auto mt-12 max-w-md rounded-2xl bg-white p-8 shadow-huddle md:mt-20 md:p-12"
>
	<p class="text-xs font-semibold uppercase tracking-wider text-fog">
		Early access
	</p>
	<h1 class="mt-2 text-2xl font-extrabold text-ink md:text-3xl">
		Enter password to continue
	</h1>
	<p class="mt-3 text-sm text-fog">
		Huddle Health is in soft launch.
	</p>

	<form method="POST" use:enhance class="mt-6 flex flex-col gap-3">
		<input
			type="password"
			name="password"
			placeholder="Password"
			autocomplete="off"
			required
			class="w-full rounded-full border border-mist bg-white px-4 py-2 text-sm text-ink shadow-sm focus:border-ice-500 focus:outline-none focus:ring-2 focus:ring-ice-500/30"
		/>
		<button
			type="submit"
			class="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white shadow-huddle transition hover:bg-ice-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ice-500"
		>
			Unlock
		</button>
		{#if form?.error}
			<p class="text-center text-sm text-coral">{form.error}</p>
		{/if}
	</form>
</div>
