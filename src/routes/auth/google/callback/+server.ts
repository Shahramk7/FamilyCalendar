import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeGoogleCode } from '$lib/server/google-calendar';
import { encryptTokens } from '$lib/server/crypto';
import { updateMemberTokens } from '$lib/server/db';

export const GET: RequestHandler = async ({ url, platform }) => {
	const code = url.searchParams.get('code');
	const memberId = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	if (error) {
		redirect(302, `/setup?error=${encodeURIComponent(error)}`);
	}

	if (!code || !memberId) {
		return new Response('Missing code or state', { status: 400 });
	}

	const env = platform!.env;
	const redirectUri = `${url.origin}/auth/google/callback`;

	const tokens = await exchangeGoogleCode(
		code,
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		redirectUri
	);

	const { ciphertext, iv } = await encryptTokens(tokens, env.ENCRYPTION_KEY);
	await updateMemberTokens(env.DB, memberId, ciphertext, iv);

	redirect(302, '/setup?connected=google');
};
