import type { TokenSet, CalendarEvent } from '$lib/types';
import { encryptTokens, decryptTokens } from './crypto';
import { updateMemberTokens } from './db';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

/**
 * Build the Google OAuth2 authorization URL.
 */
export function getGoogleAuthUrl(
	clientId: string,
	redirectUri: string,
	memberId: string
): string {
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: SCOPE,
		access_type: 'offline',
		prompt: 'consent',
		state: memberId
	});
	return `${GOOGLE_AUTH_URL}?${params}`;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeGoogleCode(
	code: string,
	clientId: string,
	clientSecret: string,
	redirectUri: string
): Promise<TokenSet> {
	const res = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code'
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Google token exchange failed: ${err}`);
	}

	const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token,
		expires_at: Date.now() + data.expires_in * 1000
	};
}

/**
 * Refresh an expired Google access token.
 */
async function refreshGoogleToken(
	refreshToken: string,
	clientId: string,
	clientSecret: string
): Promise<{ access_token: string; expires_at: number }> {
	const res = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			refresh_token: refreshToken,
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'refresh_token'
		})
	});

	if (!res.ok) {
		throw new Error(`Google token refresh failed: ${await res.text()}`);
	}

	const data = (await res.json()) as { access_token: string; expires_in: number };
	return {
		access_token: data.access_token,
		expires_at: Date.now() + data.expires_in * 1000
	};
}

/**
 * Get a valid access token, refreshing if expired.
 * Re-encrypts and saves updated tokens to DB.
 */
export async function getValidGoogleToken(
	tokens: TokenSet,
	memberId: string,
	clientId: string,
	clientSecret: string,
	encryptionKey: string,
	db: D1Database
): Promise<string> {
	if (tokens.expires_at > Date.now() + 60_000) {
		return tokens.access_token;
	}

	const refreshed = await refreshGoogleToken(tokens.refresh_token, clientId, clientSecret);
	const newTokens: TokenSet = {
		access_token: refreshed.access_token,
		refresh_token: tokens.refresh_token,
		expires_at: refreshed.expires_at
	};

	const { ciphertext, iv } = await encryptTokens(newTokens, encryptionKey);
	await updateMemberTokens(db, memberId, ciphertext, iv);

	return newTokens.access_token;
}

/**
 * Fetch Google Calendar events for a given week.
 */
export async function fetchGoogleEvents(
	accessToken: string,
	timeMin: string,
	timeMax: string,
	memberName: string,
	memberId: string,
	memberColor: string
): Promise<CalendarEvent[]> {
	const params = new URLSearchParams({
		timeMin,
		timeMax,
		singleEvents: 'true',
		orderBy: 'startTime',
		maxResults: '250'
	});

	const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!res.ok) {
		console.error(`Google Calendar API error: ${await res.text()}`);
		return [];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = (await res.json()) as { items?: any[] };
	return (data.items || []).map(
		(item: {
			id: string;
			summary?: string;
			start: { dateTime?: string; date?: string };
			end: { dateTime?: string; date?: string };
		}) => ({
			id: item.id,
			title: item.summary || '(No title)',
			start: item.start.dateTime || item.start.date || '',
			end: item.end.dateTime || item.end.date || '',
			all_day: !item.start.dateTime,
			member_id: memberId,
			member_name: memberName,
			member_color: memberColor
		})
	);
}
