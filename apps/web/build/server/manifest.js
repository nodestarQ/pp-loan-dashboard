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
		client: {start:"_app/immutable/entry/start.C_fB7wFU.js",app:"_app/immutable/entry/app.DM0OgB0G.js",imports:["_app/immutable/entry/start.C_fB7wFU.js","_app/immutable/chunks/DXu1icUn.js","_app/immutable/chunks/jXUvQDND.js","_app/immutable/entry/app.DM0OgB0G.js","_app/immutable/chunks/jXUvQDND.js","_app/immutable/chunks/Dj6f-nJM.js","_app/immutable/chunks/DEDqjojZ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-C3hAGrat.js')),
			__memo(() => import('./chunks/1-DVV72Mgw.js')),
			__memo(() => import('./chunks/2-Dwtuvqbx.js'))
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
