/**
 * Simple session management using Cloudflare KV.
 * Session ID stored in HTTP-only cookie, maps to family_id in KV.
 */

const SESSION_COOKIE = 'fc_session';
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

export function getSessionId(cookies: { get: (name: string) => string | undefined }): string | undefined {
	return cookies.get(SESSION_COOKIE);
}

export async function getSessionFamilyId(
	kv: KVNamespace,
	sessionId: string
): Promise<string | null> {
	return kv.get(`session:${sessionId}`);
}

export async function createSession(
	kv: KVNamespace,
	familyId: string,
	cookies: import('@sveltejs/kit').Cookies
): Promise<string> {
	const sessionId = crypto.randomUUID();
	await kv.put(`session:${sessionId}`, familyId, { expirationTtl: SESSION_TTL });
	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: SESSION_TTL
	});
	return sessionId;
}
