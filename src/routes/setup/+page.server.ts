import type { PageServerLoad, Actions } from './$types';
import { getSessionId, getSessionFamilyId, createSession } from '$lib/server/session';
import { getFamily, getFamilyByName, createFamily, getMembers, createMember, deleteMember } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, platform, url }) => {
	const env = platform!.env;

	const sessionId = getSessionId(cookies);
	let familyId: string | null = null;

	if (sessionId) {
		familyId = await getSessionFamilyId(env.SESSIONS, sessionId);
	}

	let family = null;
	let members: Awaited<ReturnType<typeof getMembers>> = [];

	if (familyId) {
		family = await getFamily(env.DB, familyId);
		if (family) {
			members = await getMembers(env.DB, familyId);
		}
	}

	return {
		family,
		members,
		connected: url.searchParams.get('connected'),
		error: url.searchParams.get('error')
	};
};

export const actions: Actions = {
	createFamily: async ({ request, platform, cookies }) => {
		const env = platform!.env;
		const data = await request.formData();
		const name = data.get('name') as string;

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Family name is required' });
		}

		const existing = await getFamilyByName(env.DB, name.trim());
		if (existing) {
			await createSession(env.SESSIONS, existing.id, cookies);
			return { success: true };
		}

		const familyId = crypto.randomUUID();
		await createFamily(env.DB, familyId, name.trim());
		await createSession(env.SESSIONS, familyId, cookies);

		return { success: true };
	},

	addMember: async ({ request, platform, cookies }) => {
		const env = platform!.env;
		const sessionId = getSessionId(cookies);
		if (!sessionId) return fail(401, { error: 'Not authenticated' });

		const familyId = await getSessionFamilyId(env.SESSIONS, sessionId);
		if (!familyId) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const name = data.get('name') as string;
		const color = data.get('color') as string;
		const provider = data.get('provider') as 'google' | 'outlook';

		if (!name || !color || !provider) {
			return fail(400, { error: 'All fields are required' });
		}

		const memberId = crypto.randomUUID();
		await createMember(env.DB, memberId, familyId, name.trim(), color, provider);

		return { success: true, memberId };
	},

	removeMember: async ({ request, platform, cookies }) => {
		const env = platform!.env;
		const sessionId = getSessionId(cookies);
		if (!sessionId) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const memberId = data.get('memberId') as string;
		if (!memberId) return fail(400, { error: 'Member ID required' });

		await deleteMember(env.DB, memberId);
		return { success: true };
	}
};
