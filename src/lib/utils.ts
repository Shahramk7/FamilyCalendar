/**
 * Get day names for the week (Mon-Sun).
 */
export function getWeekDays(weekStart: Date): { date: Date; label: string; dateLabel: string; isToday: boolean }[] {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const days = [];

	for (let i = 0; i < 7; i++) {
		const date = new Date(weekStart);
		date.setDate(weekStart.getDate() + i);
		const isToday =
			date.getFullYear() === today.getFullYear() &&
			date.getMonth() === today.getMonth() &&
			date.getDate() === today.getDate();

		days.push({
			date,
			label: dayNames[i],
			dateLabel: `${date.getDate()}/${date.getMonth() + 1}`,
			isToday
		});
	}

	return days;
}

/**
 * Get Monday of the week containing the given date.
 */
export function getMonday(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Format a date as "March 30 - April 5, 2026"
 */
export function formatWeekRange(monday: Date): string {
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);

	const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
	const start = monday.toLocaleDateString('en-US', opts);
	const end = sunday.toLocaleDateString('en-US', { ...opts, year: 'numeric' });

	return `${start} - ${end}`;
}

/**
 * Convert an ISO datetime to a fractional hour (e.g., 9:30 -> 9.5).
 */
export function toFractionalHour(isoString: string): number {
	const d = new Date(isoString);
	return d.getHours() + d.getMinutes() / 60;
}

/**
 * Check if two dates are the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/**
 * Generate time slots from startHour to endHour in 30-min increments.
 */
export function generateTimeSlots(startHour: number = 7, endHour: number = 21): string[] {
	const slots: string[] = [];
	for (let h = startHour; h < endHour; h++) {
		slots.push(`${h === 0 ? 12 : h > 12 ? h - 12 : h}:00${h < 12 ? 'am' : 'pm'}`);
		slots.push(`${h === 0 ? 12 : h > 12 ? h - 12 : h}:30${h < 12 ? 'am' : 'pm'}`);
	}
	return slots;
}
