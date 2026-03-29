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
