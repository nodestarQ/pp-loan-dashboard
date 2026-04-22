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
		client: {start:"_app/immutable/entry/start.C10DHh07.js",app:"_app/immutable/entry/app.DDs-WmEG.js",imports:["_app/immutable/entry/start.C10DHh07.js","_app/immutable/chunks/CP633L2j.js","_app/immutable/chunks/CTkAPK-U.js","_app/immutable/entry/app.DDs-WmEG.js","_app/immutable/chunks/CTkAPK-U.js","_app/immutable/chunks/Dj6f-nJM.js","_app/immutable/chunks/DEDqjojZ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-BU275905.js')),
			__memo(() => import('./chunks/1-BvvhqIS3.js')),
			__memo(() => import('./chunks/2-BosK9G_s.js'))
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
