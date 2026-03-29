import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { toggleMeal } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform!.env.DB;
	const { memberId, date, mealType } = (await request.json()) as {
		memberId: string;
		date: string;
		mealType: 'breakfast' | 'lunch';
	};

	if (!memberId || !date || !mealType) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const checked = await toggleMeal(db, memberId, date, mealType);
	return json({ checked });
};
