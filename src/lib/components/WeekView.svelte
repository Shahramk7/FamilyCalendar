<script lang="ts">
	import type { Member, CalendarEvent } from '$lib/types';
	import { getWeekDays, isSameDay } from '$lib/utils';
	import GanttRow from './GanttRow.svelte';

	let {
		weekStart,
		members,
		events,
		meals,
		onDayClick
	}: {
		weekStart: Date;
		members: Member[];
		events: CalendarEvent[];
		meals: { member_id: string; date: string; meal_type: string }[];
		onDayClick: (date: Date) => void;
	} = $props();

	const DAY_START = 7;
	const DAY_END = 21;

	const days = $derived(getWeekDays(weekStart));

	// Mutable local meal state for optimistic updates
	let mealSet: Set<string> = $state(
		new Set(meals.map((m) => `${m.member_id}:${m.date}:${m.meal_type}`))
	);

	let expandedMemberId: string | null = $state(null);

	function toggleExpand(memberId: string) {
		expandedMemberId = expandedMemberId === memberId ? null : memberId;
	}

	function toDateStr(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function isMealChecked(memberId: string, dateStr: string, mealType: string): boolean {
		return mealSet.has(`${memberId}:${dateStr}:${mealType}`);
	}

	async function handleMealToggle(memberId: string, date: Date, mealType: 'breakfast' | 'lunch') {
		const dateStr = toDateStr(date);
		const key = `${memberId}:${dateStr}:${mealType}`;

		// Optimistic update
		const next = new Set(mealSet);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		mealSet = next;

		// Persist
		await fetch('/api/meals', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ memberId, date: dateStr, mealType })
		});
	}

	function getEventsForMemberDay(memberId: string, day: Date): CalendarEvent[] {
		return events.filter((e) => {
			if (e.member_id !== memberId) return false;
			return isSameDay(new Date(e.start), day);
		});
	}
</script>

<div class="overflow-x-auto rounded-[12px] bg-white shadow-sm">
	<table class="w-full border-collapse">
		<!-- Day headers -->
		<thead>
			<tr>
				<th class="w-24 border-b border-[#F5EBDA] px-3 py-3 text-left text-sm font-medium text-[#9C9590]">
					<!-- empty corner -->
				</th>
				{#each days as day}
					<th
						class="border-b border-l border-[#F5EBDA] px-2 py-3 text-center transition-colors hover:bg-[#FDF6EC] {day.isToday ? 'bg-[#FDF6EC]' : ''}"
					>
						<button onclick={() => onDayClick(day.date)} class="cursor-pointer text-center">
							<div class="text-xs font-medium text-[#9C9590]">{day.label}</div>
							<div
								class="text-sm font-semibold text-[#3A3530] {day.isToday
									? 'rounded-full bg-[#E8786B] px-2 py-0.5 text-white'
									: ''}"
							>
								{day.dateLabel}
							</div>
						</button>
					</th>
				{/each}
			</tr>
		</thead>

		<tbody>
			{#each members as member}
				<!-- Main member row -->
				<tr class="border-b border-[#F5EBDA]">
					<td class="px-3 py-4">
						<button
							onclick={() => toggleExpand(member.id)}
							class="flex items-center gap-2 transition-opacity hover:opacity-70"
						>
							<span
								class="inline-block h-3 w-3 shrink-0 rounded-full"
								style="background-color: {member.color}"
							></span>
							<span class="text-sm font-semibold text-[#3A3530]">{member.name}</span>
							<svg
								class="h-3 w-3 text-[#9C9590] transition-transform {expandedMemberId === member.id
									? 'rotate-180'
									: ''}"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
					</td>

					{#each days as day}
						{@const dateStr = toDateStr(day.date)}
						<td
							class="border-l border-[#F5EBDA] px-1 py-3 {day.isToday ? 'bg-[#FDF6EC]/50' : ''}"
						>
							<GanttRow
								events={getEventsForMemberDay(member.id, day.date)}
								color={member.color}
								dayStart={DAY_START}
								dayEnd={DAY_END}
								breakfast={isMealChecked(member.id, dateStr, 'breakfast')}
								lunch={isMealChecked(member.id, dateStr, 'lunch')}
							/>
						</td>
					{/each}
				</tr>

				<!-- Expandable meal row -->
				{#if expandedMemberId === member.id}
					<tr class="border-b border-[#F5EBDA] bg-[#FDF6EC]/40">
						<td class="px-3 py-2 text-xs font-medium text-[#9C9590]">Meals</td>
						{#each days as day}
							{@const dateStr = toDateStr(day.date)}
							<td
								class="border-l border-[#F5EBDA] px-1 py-2 {day.isToday ? 'bg-[#FDF6EC]/50' : ''}"
							>
								<div class="flex flex-col items-center gap-1.5">
									<label class="flex cursor-pointer items-center gap-1" title="Breakfast">
										<input
											type="checkbox"
											checked={isMealChecked(member.id, dateStr, 'breakfast')}
											onchange={() => handleMealToggle(member.id, day.date, 'breakfast')}
											class="h-3 w-3 cursor-pointer rounded"
											style="accent-color: {member.color}"
										/>
										<span class="text-sm leading-none">☕</span>
									</label>
									<label class="flex cursor-pointer items-center gap-1" title="Lunch">
										<input
											type="checkbox"
											checked={isMealChecked(member.id, dateStr, 'lunch')}
											onchange={() => handleMealToggle(member.id, day.date, 'lunch')}
											class="h-3 w-3 cursor-pointer rounded"
											style="accent-color: {member.color}"
										/>
										<span class="text-sm leading-none">🍽️</span>
									</label>
								</div>
							</td>
						{/each}
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>

	<!-- Time axis label -->
	<div
		class="flex items-center justify-between border-t border-[#F5EBDA] px-3 py-2 text-xs text-[#9C9590]"
	>
		<span>7am</span>
		<span class="mx-2 flex-1 border-t border-dashed border-[#F5EBDA]"></span>
		<span>12pm</span>
		<span class="mx-2 flex-1 border-t border-dashed border-[#F5EBDA]"></span>
		<span>9pm</span>
	</div>
</div>
