<script lang="ts">
	import { onMount } from "svelte";

	// Type-only import is erased at compile time, so SSR never evaluates
	// @rive-app/canvas-lite (it ships as CJS which SvelteKit's SSR cannot
	// named-import). The real runtime import happens inside onMount below,
	// which only runs client-side.
	import type { Rive as RiveType } from "@rive-app/canvas-lite";

	// Damage overlays as they appear on the Rive view model, ordered from
	// subtle to severe. A damage ratio of 1 turns on all N; a ratio of 0
	// turns them all off. Each overlay represents 1/N of the full range.
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
	const HEAD_HOVERED_PROPERTY = "headHovered";

	type OverlayName = (typeof DAMAGE_OVERLAYS)[number];
	type RiveNumber = { value: number };
	type RiveBoolean = { value: boolean };

	interface Props {
		// 0 = no damage, 1 = all overlays on. Values outside [0,1] are
		// clamped. Caller is responsible for the domain mapping (e.g.
		// active_loans / goal_target).
		damageRatio: number;
	}
	const { damageRatio }: Props = $props();

	const N = DAMAGE_OVERLAYS.length;
	const damageLevel = $derived(
		Math.min(N, Math.max(0, Math.floor(damageRatio * N))),
	);

	let canvas: HTMLCanvasElement;
	let ready = $state(false);

	// Plain (non-reactive) refs for the Rive class instances, since if Svelte
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

	$effect(() => {
		if (ready) applyDamageLevel(damageLevel);
	});

	onMount(() => {
		let rive: RiveType | undefined;
		let cancelled = false;

		const onResize = () => rive?.resizeDrawingSurfaceToCanvas();

		// Forward page-wide pointer movement onto the canvas so the
		// character's eye/head-follow behaviour tracks the cursor across
		// the whole document, not only while hovering the canvas itself.
		// Rive's internal listener computes canvas-local coords as
		// (clientX - canvasRect.left), which happily produces values
		// outside the canvas bounds when the mouse is elsewhere on screen.
		// We skip dispatch while the cursor is already over the canvas to
		// avoid double-processing the same event.
		const onDocMouseMove = (e: MouseEvent) => {
			if (!canvas) return;
			if (e.target === canvas) return;
			canvas.dispatchEvent(
				new MouseEvent("mousemove", {
					clientX: e.clientX,
					clientY: e.clientY,
					bubbles: false,
				}),
			);
		};
		window.addEventListener("mousemove", onDocMouseMove);

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
					// Drive the canvas cursor off a view-model boolean the
					// Rive file flips via Pointer Enter/Exit listeners on the
					// head shape. Initial assignment covers the mouse-never-
					// moved case; the subscription covers every change after.
					const headHoveredProp = vmi?.boolean(HEAD_HOVERED_PROPERTY);
					if (headHoveredProp) {
						const syncCursor = () => {
							canvas.style.cursor = headHoveredProp.value
								? "pointer"
								: "default";
						};
						syncCursor();
						headHoveredProp.on(syncCursor);
					} else {
						console.warn(
							`[rive] no boolean property named "${HEAD_HOVERED_PROPERTY}" on view model`,
						);
					}
					ready = true;
					// Expose on window for devtools poking.
					(window as unknown as { __rive: unknown }).__rive = rive;
				},
			});
			window.addEventListener("resize", onResize);
		})();

		return () => {
			cancelled = true;
			window.removeEventListener("resize", onResize);
			window.removeEventListener("mousemove", onDocMouseMove);
			rive?.cleanup();
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="mx-auto aspect-[3/2] w-full max-w-xl"
	aria-label="Pudgy Penguin animation"
></canvas>
