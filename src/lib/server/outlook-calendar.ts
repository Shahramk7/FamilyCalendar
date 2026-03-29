import type { TokenSet, CalendarEvent } from '$lib/types';
import { encryptTokens } from './crypto';
import { updateMemberTokens } from './db';

const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API = 'https://graph.microsoft.com/v1.0';
const SCOPES = 'Calendars.Read offline_access';

/**
 * Build the Microsoft OAuth2 authorization URL.
 */
export function getOutlookAuthUrl(
	clientId: string,
	redirectUri: string,
	memberId: string
): string {
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: SCOPES,
		response_mode: 'query',
		state: memberId
	});
	return `${MS_AUTH_URL}?${params}`;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeOutlookCode(
	code: string,
	clientId: string,
	clientSecret: string,
	redirectUri: string
): Promise<TokenSet> {
	const res = await fetch(MS_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code',
			scope: SCOPES
		})
	});

	if (!res.ok) {
		throw new Error(`Outlook token exchange failed: ${await res.text()}`);
	}

	const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token,
		expires_at: Date.now() + data.expires_in * 1000
	};
}

/**
 * Refresh an expired Outlook access token.
 */
async function refreshOutlookToken(
	refreshToken: string,
	clientId: string,
	clientSecret: string
): Promise<{ access_token: string; refresh_token: string; expires_at: number }> {
	const res = await fetch(MS_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			refresh_token: refreshToken,
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'refresh_token',
			scope: SCOPES
		})
	});

	if (!res.ok) {
		throw new Error(`Outlook token refresh failed: ${await res.text()}`);
	}

	const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token || refreshToken,
		expires_at: Date.now() + data.expires_in * 1000
	};
}

/**
 * Get a valid access token, refreshing if expired.
 */
export async function getValidOutlookToken(
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

	const refreshed = await refreshOutlookToken(tokens.refresh_token, clientId, clientSecret);
	const newTokens: TokenSet = {
		access_token: refreshed.access_token,
		refresh_token: refreshed.refresh_token,
		expires_at: refreshed.expires_at
	};

	const { ciphertext, iv } = await encryptTokens(newTokens, encryptionKey);
	await updateMemberTokens(db, memberId, ciphertext, iv);

	return newTokens.access_token;
}

/**
 * Fetch Outlook Calendar events for a given week.
 */
export async function fetchOutlookEvents(
	accessToken: string,
	timeMin: string,
	timeMax: string,
	memberName: string,
	memberId: string,
	memberColor: string
): Promise<CalendarEvent[]> {
	const params = new URLSearchParams({
		startDateTime: timeMin,
		endDateTime: timeMax,
		$select: 'id,subject,start,end,isAllDay',
		$orderby: 'start/dateTime',
		$top: '250'
	});

	const res = await fetch(`${GRAPH_API}/me/calendarView?${params}`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!res.ok) {
		console.error(`Outlook Calendar API error: ${await res.text()}`);
		return [];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = (await res.json()) as { value?: any[] };
	return (data.value || []).map(
		(item: {
			id: string;
			subject?: string;
			start: { dateTime: string; timeZone: string };
			end: { dateTime: string; timeZone: string };
			isAllDay?: boolean;
		}) => ({
			id: item.id,
			title: item.subject || '(No title)',
			start: item.start.dateTime + 'Z',
			end: item.end.dateTime + 'Z',
			all_day: item.isAllDay || false,
			member_id: memberId,
			member_name: memberName,
			member_color: memberColor
		})
	);
}
