-- FamilyCalendar initial schema
-- Run with: wrangler d1 execute family-calendar-db --file=./migrations/0001_init.sql

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
