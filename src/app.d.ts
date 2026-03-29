// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}

	interface Env {
		DB: D1Database;
		SESSIONS: KVNamespace;
		ENCRYPTION_KEY: string;
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;
		OUTLOOK_CLIENT_ID: string;
		OUTLOOK_CLIENT_SECRET: string;
	}
}

export {};
