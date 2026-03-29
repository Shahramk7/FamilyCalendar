import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleAuthUrl } from '$lib/server/google-calendar';

export const GET: RequestHandler = async ({ url, platform }) => {
	const memberId = url.searchParams.get('memberId');
	if (!memberId) {
		return new Response('Missing memberId', { status: 400 });
	}

	const env = platform!.env;
	const redirectUri = `${url.origin}/auth/google/callback`;
	const authUrl = getGoogleAuthUrl(env.GOOGLE_CLIENT_ID, redirectUri, memberId);

	redirect(302, authUrl);
};
