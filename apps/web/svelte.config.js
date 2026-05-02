import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// CSP is set manually in hooks.server.ts. SvelteKit's auto-CSP injects
		// nonces into script-src, which (per CSP3) makes 'unsafe-inline' a
		// no-op. MetaMask and other browser wallets append an inline <script>
		// to set window.ethereum, so a nonced policy permanently blocks them.
	},
};

export default config;
