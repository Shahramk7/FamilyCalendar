import type { Family, Member } from '$lib/types';

/** SQL to create all tables. Run once via wrangler d1 execute. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  encrypted_tokens TEXT,
  token_iv TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`;

export async function getFamily(db: D1Database, familyId: string): Promise<Family | null> {
	return db.prepare('SELECT * FROM families WHERE id = ?').bind(familyId).first<Family>();
}

export async function createFamily(db: D1Database, id: string, name: string): Promise<void> {
	await db.prepare('INSERT INTO families (id, name) VALUES (?, ?)').bind(id, name).run();
}

export async function getFamilyByName(db: D1Database, name: string): Promise<Family | null> {
	return db.prepare('SELECT * FROM families WHERE LOWER(name) = LOWER(?)').bind(name).first<Family>();
}

export async function getAllFamilies(db: D1Database): Promise<(Family & { member_count: number })[]> {
	const result = await db
		.prepare(`
			SELECT f.*, COUNT(m.id) as member_count
			FROM families f
			LEFT JOIN members m ON m.family_id = f.id
			GROUP BY f.id
			ORDER BY f.created_at DESC
		`)
		.all<Family & { member_count: number }>();
	return result.results;
}

export async function updateFamilyName(db: D1Database, familyId: string, name: string): Promise<void> {
	await db.prepare('UPDATE families SET name = ? WHERE id = ?').bind(name, familyId).run();
}

export async function deleteFamily(db: D1Database, familyId: string): Promise<void> {
	await db.prepare('DELETE FROM families WHERE id = ?').bind(familyId).run();
}

export async function getMembers(db: D1Database, familyId: string): Promise<Member[]> {
	const result = await db
		.prepare('SELECT * FROM members WHERE family_id = ? ORDER BY created_at')
		.bind(familyId)
		.all<Member>();
	return result.results;
}

export async function getMember(db: D1Database, memberId: string): Promise<Member | null> {
	return db.prepare('SELECT * FROM members WHERE id = ?').bind(memberId).first<Member>();
}

export async function createMember(
	db: D1Database,
	id: string,
	familyId: string,
	name: string,
	color: string,
	provider: 'google' | 'outlook'
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO members (id, family_id, name, color, provider) VALUES (?, ?, ?, ?, ?)'
		)
		.bind(id, familyId, name, color, provider)
		.run();
}

export async function updateMemberTokens(
	db: D1Database,
	memberId: string,
	encryptedTokens: string,
	tokenIv: string
): Promise<void> {
	await db
		.prepare('UPDATE members SET encrypted_tokens = ?, token_iv = ? WHERE id = ?')
		.bind(encryptedTokens, tokenIv, memberId)
		.run();
}

export async function deleteMember(db: D1Database, memberId: string): Promise<void> {
	await db.prepare('DELETE FROM members WHERE id = ?').bind(memberId).run();
}

export async function getMealsForWeek(
	db: D1Database,
	memberIds: string[],
	dateFrom: string,
	dateTo: string
): Promise<{ member_id: string; date: string; meal_type: string }[]> {
	if (memberIds.length === 0) return [];
	const placeholders = memberIds.map(() => '?').join(', ');
	const result = await db
		.prepare(
			`SELECT member_id, date, meal_type FROM meals WHERE member_id IN (${placeholders}) AND date >= ? AND date <= ?`
		)
		.bind(...memberIds, dateFrom, dateTo)
		.all<{ member_id: string; date: string; meal_type: string }>();
	return result.results;
}

export async function toggleMeal(
	db: D1Database,
	memberId: string,
	date: string,
	mealType: 'breakfast' | 'lunch'
): Promise<boolean> {
	const existing = await db
		.prepare('SELECT 1 FROM meals WHERE member_id = ? AND date = ? AND meal_type = ?')
		.bind(memberId, date, mealType)
		.first();

	if (existing) {
		await db
			.prepare('DELETE FROM meals WHERE member_id = ? AND date = ? AND meal_type = ?')
			.bind(memberId, date, mealType)
			.run();
		return false;
	} else {
		await db
			.prepare('INSERT INTO meals (member_id, date, meal_type) VALUES (?, ?, ?)')
			.bind(memberId, date, mealType)
			.run();
		return true;
	}
}
