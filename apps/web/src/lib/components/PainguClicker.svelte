<script lang="ts">
	import { onMount } from "svelte";

	// Type-only import is erased at compile time, so SSR never evaluates
	// @rive-app/canvas-lite (it ships as CJS which SvelteKit's SSR cannot
	// named-import). The real runtime import happens inside onMount below,
	// which only runs client-side.
	import type { Rive as RiveType } from "@rive-app/canvas-lite";

	let canvas: HTMLCanvasElement;

	onMount(() => {
		let rive: RiveType | undefined;
		let cancelled = false;

		const onResize = () => rive?.resizeDrawingSurfaceToCanvas();

		// Dynamic import + async work inside a sync-returning onMount:
		// schedule the load, run cleanup whether or not the load finished.
		void (async () => {
			const { Rive, RuntimeLoader } = await import("@rive-app/canvas-lite");
			// Point the runtime at our own origin so CSP's `connect-src: self`
			// is enough. Default upstream behaviour is to fetch the WASM from
			// unpkg.com with a jsDelivr fallback, both of which would need
			// explicit CSP allowances. The .wasm here is copied from
			// node_modules by scripts/rive-setup.sh (or on postinstall).
			RuntimeLoader.setWasmUrl("/character/rive.wasm");
			if (cancelled) return;
			rive = new Rive({
				canvas,
				src: "/character/painguclicker.riv",
				stateMachines: "idle",
				autoplay: true,
				onLoad: () => {
					rive?.resizeDrawingSurfaceToCanvas();
					const r = rive as unknown as Record<string, unknown>;
					if (!r) return;
					console.log("[rive] animationNames:", r.animationNames);
					console.log("[rive] stateMachineNames:", r.stateMachineNames);
					try {
						const getInputs = r.stateMachineInputs as
							| ((name: string) => unknown[])
							| undefined;
						const inputs = getInputs?.call(rive, "idle") ?? [];
						console.log(
							"[rive] idle input detail:",
							(inputs as Array<Record<string, unknown>>).map((i) => ({
								name: i.name,
								type: i.type,
								value: i.value,
							})),
						);
					} catch (err) {
						console.log("[rive] idle inputs error:", err);
					}
					// Expose the instance so you can poke at it from the devtools
					// console: __rive.play("hurtL"), __rive.play("OpenMouth"), etc.
					(window as unknown as { __rive: unknown }).__rive = rive;
				},
			});
			window.addEventListener("resize", onResize);
		})();

		return () => {
			cancelled = true;
			window.removeEventListener("resize", onResize);
			rive?.cleanup();
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="mx-auto aspect-square w-full max-w-xl"
	aria-label="Pudgy Penguin animation"
></canvas>
