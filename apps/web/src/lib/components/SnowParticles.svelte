<script lang="ts">
	import { onMount } from "svelte";

	interface Props {
		/** Number of particles. Scales with viewport width inside onMount. */
		count?: number;
	}
	let { count = 60 }: Props = $props();

	let canvas: HTMLCanvasElement;

	type Particle = {
		x: number;
		y: number;
		r: number;
		vx: number;
		vy: number;
		o: number;
	};

	onMount(() => {
		if (typeof window === "undefined") return;

		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		);
		if (reduceMotion.matches) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let w = 0;
		let h = 0;
		let raf = 0;
		const particles: Particle[] = [];

		const resize = () => {
			w = window.innerWidth;
			h = window.innerHeight;
			const dpr = window.devicePixelRatio || 1;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};

		const spawn = () => {
			particles.length = 0;
			const n = Math.round(count * Math.min(1, w / 1200));
			for (let i = 0; i < n; i++) {
				particles.push({
					x: Math.random() * w,
					y: Math.random() * h,
					r: Math.random() * 2 + 1,
					vx: (Math.random() - 0.5) * 0.3,
					vy: Math.random() * 0.5 + 0.2,
					o: Math.random() * 0.5 + 0.35,
				});
			}
		};

		const tick = () => {
			ctx.clearRect(0, 0, w, h);
			for (const p of particles) {
				p.x += p.vx;
				p.y += p.vy;
				if (p.y - p.r > h) {
					p.y = -p.r;
					p.x = Math.random() * w;
				}
				if (p.x < -5) p.x = w + 5;
				if (p.x > w + 5) p.x = -5;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(127, 208, 245, ${p.o})`;
				ctx.fill();
			}
			raf = requestAnimationFrame(tick);
		};

		const onResize = () => {
			resize();
			spawn();
		};

		resize();
		spawn();
		tick();
		window.addEventListener("resize", onResize);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
		};
	});
</script>

<canvas
	bind:this={canvas}
	aria-hidden="true"
	class="pointer-events-none fixed inset-0 -z-10 h-screen w-screen"
></canvas>
