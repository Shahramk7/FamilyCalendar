<script lang="ts">
	import type { Member, CalendarEvent } from '$lib/types';
	import { isSameDay, toFractionalHour, generateTimeSlots } from '$lib/utils';

	let {
		date,
		members,
		events,
		onDayClick,
		onNavigateDay
	}: {
		date: Date;
		members: Member[];
		events: CalendarEvent[];
		onDayClick: (date: Date) => void;
		onNavigateDay: (date: Date) => void;
	} = $props();

	const DAY_START = 7;
	const DAY_END = 21;
	const SLOT_HEIGHT = 48; // pixels per 30-min slot
	const totalSlots = (DAY_END - DAY_START) * 2;
	const timeSlots = $derived(generateTimeSlots(DAY_START, DAY_END));

	// Filter events for this day
	const dayEvents = $derived(
		events.filter((e) => isSameDay(new Date(e.start), date))
	);

	// Get events for a specific member on this day
	function getMemberEvents(memberId: string): CalendarEvent[] {
		return dayEvents.filter((e) => e.member_id === memberId);
	}

	// Calculate event position and height in pixels
	function getEventStyle(event: CalendarEvent): { top: string; height: string } {
		const startHour = event.all_day ? DAY_START : Math.max(toFractionalHour(event.start), DAY_START);
		const endHour = event.all_day ? DAY_END : Math.min(toFractionalHour(event.end), DAY_END);

		const slotsFromTop = (startHour - DAY_START) * 2;
		const durationSlots = Math.max((endHour - startHour) * 2, 1);

		return {
			top: `${slotsFromTop * SLOT_HEIGHT}px`,
			height: `${durationSlots * SLOT_HEIGHT - 4}px`
		};
	}

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// Navigate between days
	function prevDay() {
		const prev = new Date(date);
		prev.setDate(prev.getDate() - 1);
		onNavigateDay(prev);
	}

	function nextDay() {
		const next = new Date(date);
		next.setDate(next.getDate() + 1);
		onNavigateDay(next);
	}
</script>

<!-- Day navigation within day view -->
<div class="mb-4 flex items-center justify-end gap-2">
	<button
		onclick={prevDay}
		class="rounded-[12px] bg-white p-2 text-[#6B6560] shadow-sm transition hover:shadow-md"
		aria-label="Previous day"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
		</svg>
	</button>
	<button
		onclick={nextDay}
		class="rounded-[12px] bg-white p-2 text-[#6B6560] shadow-sm transition hover:shadow-md"
		aria-label="Next day"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
	</button>
</div>

<div class="overflow-x-auto rounded-[12px] bg-white shadow-sm">
	<div class="min-w-[600px]">
		<!-- Member column headers -->
		<div class="flex border-b border-[#F5EBDA]">
			<div class="w-20 shrink-0 px-3 py-3 text-sm font-medium text-[#9C9590]">Time</div>
			{#each members as member}
				<div class="flex-1 border-l border-[#F5EBDA] px-3 py-3 text-center">
					<div class="flex items-center justify-center gap-2">
						<span
							class="inline-block h-3 w-3 rounded-full"
							style="background-color: {member.color}"
						></span>
						<span class="text-sm font-semibold text-[#3A3530]">{member.name}</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- Time grid -->
		<div class="relative flex">
			<!-- Time labels -->
			<div class="w-20 shrink-0">
				{#each timeSlots as slot, i}
					<div
						class="flex items-start border-b border-[#F5EBDA]/50 px-3 text-xs text-[#9C9590]"
						style="height: {SLOT_HEIGHT}px"
					>
						{#if i % 2 === 0}
							<span class="pt-1">{slot}</span>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Member columns -->
			{#each members as member}
				<div class="relative flex-1 border-l border-[#F5EBDA]">
					<!-- Grid lines -->
					{#each timeSlots as _, i}
						<div
							class="border-b border-[#F5EBDA]/50 {i % 2 === 0 ? 'border-[#F5EBDA]' : 'border-[#F5EBDA]/30'}"
							style="height: {SLOT_HEIGHT}px"
						></div>
					{/each}

					<!-- Events overlay -->
					{#each getMemberEvents(member.id) as event}
						{@const style = getEventStyle(event)}
						<div
							class="absolute left-1 right-1 overflow-hidden rounded-[6px] px-2 py-1 text-white"
							style="top: {style.top}; height: {style.height}; background-color: {member.color}"
						>
							<div class="text-xs font-semibold leading-tight">{event.title}</div>
							{#if !event.all_day}
								<div class="text-xs opacity-80">
									{formatTime(event.start)} - {formatTime(event.end)}
								</div>
							{:else}
								<div class="text-xs opacity-80">All day</div>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
