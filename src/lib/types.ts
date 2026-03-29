export interface Family {
	id: string;
	name: string;
	created_at: string;
}

export interface Member {
	id: string;
	family_id: string;
	name: string;
	color: string;
	provider: 'google' | 'outlook';
	encrypted_tokens: string | null;
	token_iv: string | null;
	created_at: string;
}

export interface CalendarEvent {
	id: string;
	title: string;
	start: string; // ISO 8601
	end: string; // ISO 8601
	all_day: boolean;
	member_id: string;
	member_name: string;
	member_color: string;
}

export interface MemberWithEvents extends Member {
	events: CalendarEvent[];
	connected: boolean;
}

export interface TokenSet {
	access_token: string;
	refresh_token: string;
	expires_at: number; // Unix timestamp ms
}

export type ViewMode = 'week' | 'day';

/** Preset colors for family members */
export const MEMBER_COLORS = [
	{ name: 'Coral', value: '#E8786B' },
	{ name: 'Teal', value: '#4CB8A5' },
	{ name: 'Amber', value: '#E8A84C' },
	{ name: 'Lavender', value: '#8B7EC8' },
	{ name: 'Sky', value: '#5BA4D9' },
	{ name: 'Rose', value: '#D4749A' },
	{ name: 'Mint', value: '#6BC4A6' },
	{ name: 'Peach', value: '#E89B73' }
] as const;
