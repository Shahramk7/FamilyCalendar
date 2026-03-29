import type { PageServerLoad } from './$types';
import type { CalendarEvent, Member } from '$lib/types';
import { getSessionId, getSessionFamilyId } from '$lib/server/session';
import { getFamily, getMembers } from '$lib/server/db';
import { fetchAllMemberEvents, getWeekBounds } from '$lib/server/events';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, platform, url }) => {
	const env = platform!.env;

	// Check session
	const sessionId = getSessionId(cookies);
	if (!sessionId) {
		redirect(302, '/setup');
	}

	const familyId = await getSessionFamilyId(env.SESSIONS, sessionId);
	if (!familyId) {
		redirect(302, '/setup');
	}

	const family = await getFamily(env.DB, familyId);
	if (!family) {
		redirect(302, '/setup');
	}

	const members = await getMembers(env.DB, familyId);

	// Determine which week to show
	const weekParam = url.searchParams.get('week');
	const baseDate = weekParam ? new Date(weekParam) : new Date();
	const { timeMin, timeMax } = getWeekBounds(baseDate);

	// Fetch events from all connected members
	let events: CalendarEvent[] = [];
	const connectedMembers = members.filter((m) => m.encrypted_tokens);

	if (connectedMembers.length > 0) {
		events = await fetchAllMemberEvents(connectedMembers, timeMin, timeMax, {
			db: env.DB,
			encryptionKey: env.ENCRYPTION_KEY,
			googleClientId: env.GOOGLE_CLIENT_ID,
			googleClientSecret: env.GOOGLE_CLIENT_SECRET,
			outlookClientId: env.OUTLOOK_CLIENT_ID,
			outlookClientSecret: env.OUTLOOK_CLIENT_SECRET
		});
	}

	return {
		family,
		members,
		events,
		weekStart: timeMin,
		weekEnd: timeMax
	};
};
