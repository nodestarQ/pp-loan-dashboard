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
		client: {start:"_app/immutable/entry/start.BrARcNaD.js",app:"_app/immutable/entry/app.t9wYKlbI.js",imports:["_app/immutable/entry/start.BrARcNaD.js","_app/immutable/chunks/C_EvvfMQ.js","_app/immutable/chunks/Cya5Nwu3.js","_app/immutable/entry/app.t9wYKlbI.js","_app/immutable/chunks/Cya5Nwu3.js","_app/immutable/chunks/Dj6f-nJM.js","_app/immutable/chunks/DEDqjojZ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0--ddhLxaA.js')),
			__memo(() => import('./chunks/1-Bgb1G4qQ.js')),
			__memo(() => import('./chunks/2-D-OpNGvM.js'))
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
