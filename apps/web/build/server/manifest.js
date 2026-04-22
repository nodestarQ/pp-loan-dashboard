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
		client: {start:"_app/immutable/entry/start.CMRepjfM.js",app:"_app/immutable/entry/app.DcHSYURr.js",imports:["_app/immutable/entry/start.CMRepjfM.js","_app/immutable/chunks/D6-fbrfc.js","_app/immutable/chunks/ireFCRRp.js","_app/immutable/entry/app.DcHSYURr.js","_app/immutable/chunks/ireFCRRp.js","_app/immutable/chunks/Dj6f-nJM.js","_app/immutable/chunks/DEDqjojZ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-D8YjHfxb.js')),
			__memo(() => import('./chunks/1-JfOpgAP9.js')),
			__memo(() => import('./chunks/2-uveD7RrF.js'))
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
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CS_vRYO9.js'))
			},
			{
				id: "/api/sync-status",
				pattern: /^\/api\/sync-status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DVxH-sAj.js'))
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
