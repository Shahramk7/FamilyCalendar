import type { Member, CalendarEvent } from '$lib/types';
import { decryptTokens } from './crypto';
import { getValidGoogleToken, fetchGoogleEvents } from './google-calendar';
import { getValidOutlookToken, fetchOutlookEvents } from './outlook-calendar';

interface FetchConfig {
	db: D1Database;
	encryptionKey: string;
	googleClientId: string;
	googleClientSecret: string;
	outlookClientId: string;
	outlookClientSecret: string;
}

/**
 * Fetch and merge events from all family members for a given time range.
 */
export async function fetchAllMemberEvents(
	members: Member[],
	timeMin: string,
	timeMax: string,
	config: FetchConfig
): Promise<CalendarEvent[]> {
	const eventPromises = members
		.filter((m) => m.encrypted_tokens && m.token_iv)
		.map(async (member) => {
			try {
				const tokens = await decryptTokens(
					member.encrypted_tokens!,
					member.token_iv!,
					config.encryptionKey
				);

				if (member.provider === 'google') {
					const accessToken = await getValidGoogleToken(
						tokens,
						member.id,
						config.googleClientId,
						config.googleClientSecret,
						config.encryptionKey,
						config.db
					);
					return fetchGoogleEvents(
						accessToken,
						timeMin,
						timeMax,
						member.name,
						member.id,
						member.color
					);
				} else {
					const accessToken = await getValidOutlookToken(
						tokens,
						member.id,
						config.outlookClientId,
						config.outlookClientSecret,
						config.encryptionKey,
						config.db
					);
					return fetchOutlookEvents(
						accessToken,
						timeMin,
						timeMax,
						member.name,
						member.id,
						member.color
					);
				}
			} catch (err) {
				console.error(`Failed to fetch events for ${member.name}:`, err);
				return [] as CalendarEvent[];
			}
		});

	const results = await Promise.all(eventPromises);
	const allEvents = results.flat();

	// Sort by start time
	allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

	return allEvents;
}

/**
 * Get the start (Monday 00:00) and end (Sunday 23:59) of a week containing the given date.
 */
export function getWeekBounds(date: Date): { timeMin: string; timeMax: string } {
	const d = new Date(date);
	const day = d.getDay();
	// Adjust to Monday (day 1). Sunday (0) becomes -6.
	const diffToMonday = day === 0 ? -6 : 1 - day;

	const monday = new Date(d);
	monday.setDate(d.getDate() + diffToMonday);
	monday.setHours(0, 0, 0, 0);

	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	sunday.setHours(23, 59, 59, 999);

	return {
		timeMin: monday.toISOString(),
		timeMax: sunday.toISOString()
	};
}
