import type { PageServerLoad, Actions } from './$types';
import { getAllFamilies, updateFamilyName, deleteFamily, getMembers } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const families = await getAllFamilies(db);

	// Load members for each family
	const familiesWithMembers = await Promise.all(
		families.map(async (f) => ({
			...f,
			members: await getMembers(db, f.id)
		}))
	);

	return { families: familiesWithMembers };
};

export const actions: Actions = {
	rename: async ({ request, platform }) => {
		const db = platform!.env.DB;
		const data = await request.formData();
		const familyId = data.get('familyId') as string;
		const name = (data.get('name') as string)?.trim();

		if (!familyId || !name) {
			return fail(400, { error: 'Family ID and name are required' });
		}

		await updateFamilyName(db, familyId, name);
		return { success: true };
	},

	delete: async ({ request, platform }) => {
		const db = platform!.env.DB;
		const data = await request.formData();
		const familyId = data.get('familyId') as string;

		if (!familyId) {
			return fail(400, { error: 'Family ID is required' });
		}

		await deleteFamily(db, familyId);
		return { success: true };
	}
};
