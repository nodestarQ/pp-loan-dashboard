<script lang="ts">
	import { onMount } from "svelte";

	// Type-only import is erased at compile time, so SSR never evaluates
	// @rive-app/canvas-lite (it ships as CJS which SvelteKit's SSR cannot
	// named-import). The real runtime import happens inside onMount below,
	// which only runs client-side.
	import type { Rive as RiveType } from "@rive-app/canvas-lite";

	// Damage overlays as they appear on the Rive view model, ordered from
	// subtle to severe. The debug slider advances through them cumulatively:
	// at level n the first n overlays are on (opacity 1), the rest off.
	const DAMAGE_OVERLAYS = [
		"scratchesOpacity",
		"bandAidsOpacity",
		"scarEyeOpacity",
		"crackedBeakOpacity",
		"blackEyeOpacity",
		"scarUnderEyeOpacity",
		"bandageOpacity",
		"bumpOpacity",
	] as const;
	const SHOW_DAMAGE_PROPERTY = "showDamage";

	type OverlayName = (typeof DAMAGE_OVERLAYS)[number];
	type RiveNumber = { value: number };
	type RiveBoolean = { value: boolean };

	let canvas: HTMLCanvasElement;
	let damageLevel = $state(0);

	// Plain (non-reactive) refs for the Rive class instances — if Svelte
	// wraps them in a deep $state proxy, writes through the `value`
	// setter can be intercepted and never reach the WASM runtime.
	const overlayProps: Partial<Record<OverlayName, RiveNumber>> = {};
	let showDamageProp: RiveBoolean | null = null;

	function applyDamageLevel(n: number) {
		DAMAGE_OVERLAYS.forEach((name, i) => {
			const prop = overlayProps[name];
			if (prop) prop.value = i < n ? 1 : 0;
		});
		if (showDamageProp) showDamageProp.value = n > 0;
	}

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
				// Bind the artboard's default view-model instance so the
				// data-binding properties shown under the Rive "Data" tab
				// (damageOpacity, showDamage, hurtTrigger, ...) are reachable
				// via rive.viewModelInstance.
				autoBind: true,
				onLoad: () => {
					rive?.resizeDrawingSurfaceToCanvas();
					if (!rive) return;
					const vmi = rive.viewModelInstance;
					for (const name of DAMAGE_OVERLAYS) {
						const p = vmi?.number(name);
						if (p) overlayProps[name] = p;
						else
							console.warn(
								`[rive] no number property named "${name}" on view model`,
							);
					}
					showDamageProp = vmi?.boolean(SHOW_DAMAGE_PROPERTY) ?? null;
					if (!showDamageProp)
						console.warn(
							`[rive] no boolean property named "${SHOW_DAMAGE_PROPERTY}" on view model`,
						);
					applyDamageLevel(damageLevel);
					// Expose on window for devtools poking.
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

<div class="mx-auto mt-4 flex w-full max-w-xl items-center gap-3 text-sm">
	<label for="damage-level" class="shrink-0 font-mono text-neutral-400">
		damage
	</label>
	<input
		id="damage-level"
		type="range"
		min="0"
		max={DAMAGE_OVERLAYS.length}
		step="1"
		bind:value={damageLevel}
		oninput={() => applyDamageLevel(damageLevel)}
		class="flex-1"
	/>
	<span class="w-16 shrink-0 text-right font-mono tabular-nums text-neutral-400">
		{damageLevel} / {DAMAGE_OVERLAYS.length}
	</span>
</div>
