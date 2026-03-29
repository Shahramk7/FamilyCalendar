<script lang="ts">
	import type { Member, CalendarEvent } from '$lib/types';
	import { getWeekDays, toFractionalHour, isSameDay } from '$lib/utils';
	import GanttRow from './GanttRow.svelte';

	let {
		weekStart,
		members,
		events,
		onDayClick
	}: {
		weekStart: Date;
		members: Member[];
		events: CalendarEvent[];
		onDayClick: (date: Date) => void;
	} = $props();

	const DAY_START = 7; // 7am
	const DAY_END = 21; // 9pm

	const days = $derived(getWeekDays(weekStart));

	// Group events by member and day
	function getEventsForMemberDay(memberId: string, day: Date): CalendarEvent[] {
		return events.filter((e) => {
			if (e.member_id !== memberId) return false;
			const eventDate = new Date(e.start);
			return isSameDay(eventDate, day);
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
						<button
							onclick={() => onDayClick(day.date)}
							class="cursor-pointer text-center"
						>
							<div class="text-xs font-medium text-[#9C9590]">{day.label}</div>
							<div class="text-sm font-semibold text-[#3A3530] {day.isToday ? 'rounded-full bg-[#E8786B] px-2 py-0.5 text-white' : ''}">
								{day.dateLabel}
							</div>
						</button>
					</th>
				{/each}
			</tr>
		</thead>

		<!-- Member rows with Gantt bars -->
		<tbody>
			{#each members as member}
				<tr class="border-b border-[#F5EBDA] last:border-b-0">
					<td class="px-3 py-4">
						<div class="flex items-center gap-2">
							<span
								class="inline-block h-3 w-3 rounded-full"
								style="background-color: {member.color}"
							></span>
							<span class="text-sm font-semibold text-[#3A3530]">{member.name}</span>
						</div>
					</td>

					{#each days as day}
						<td class="border-l border-[#F5EBDA] px-1 py-3 {day.isToday ? 'bg-[#FDF6EC]/50' : ''}">
							<GanttRow
								events={getEventsForMemberDay(member.id, day.date)}
								color={member.color}
								dayStart={DAY_START}
								dayEnd={DAY_END}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	<!-- Time axis label -->
	<div class="flex items-center justify-between border-t border-[#F5EBDA] px-3 py-2 text-xs text-[#9C9590]">
		<span>7am</span>
		<span class="flex-1 border-t border-dashed border-[#F5EBDA] mx-2"></span>
		<span>12pm</span>
		<span class="flex-1 border-t border-dashed border-[#F5EBDA] mx-2"></span>
		<span>9pm</span>
	</div>
</div>
