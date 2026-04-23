import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		csp: {
			mode: "auto",
			directives: {
				"default-src": ["self"],
				"script-src": ["self"],
				"style-src": ["self", "unsafe-inline"],
				// OpenSea avatars are served from regional shards of seadn.io
			// (i.seadn.io, i2.seadn.io, i2c.seadn.io, ...) and the legacy
			// openseauserdata.com host. Both are required so leaderboard
			// profile pictures render under our CSP.
			"img-src": [
				"self",
				"data:",
				"https://*.seadn.io",
				"https://openseauserdata.com",
			],
				"font-src": ["self", "data:"],
				"connect-src": ["self"],
				"frame-ancestors": ["none"],
				"base-uri": ["self"],
				"form-action": ["self"],
			},
		},
	},
};

export default config;
