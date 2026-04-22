<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
	}
	let { children }: Props = $props();
</script>

<div class="rounded-2xl bg-white p-6 shadow-huddle md:p-8">
	<div class="leading-relaxed text-ink">
		{@render children()}
	</div>
</div>
