const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.WSadJkOX.js",app:"_app/immutable/entry/app.CF8KKacB.js",imports:["_app/immutable/entry/start.WSadJkOX.js","_app/immutable/chunks/D1U6BUvS.js","_app/immutable/chunks/Dy5Gz0yH.js","_app/immutable/entry/app.CF8KKacB.js","_app/immutable/chunks/Dy5Gz0yH.js","_app/immutable/chunks/Dj6f-nJM.js","_app/immutable/chunks/DEDqjojZ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-BjW32_NS.js')),
			__memo(() => import('./chunks/1-DudL68Nz.js')),
			__memo(() => import('./chunks/2-DosFmS5U.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
