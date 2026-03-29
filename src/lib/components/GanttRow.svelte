<script lang="ts">
	import type { CalendarEvent } from '$lib/types';
	import { toFractionalHour } from '$lib/utils';

	let {
		events,
		color,
		dayStart,
		dayEnd
	}: {
		events: CalendarEvent[];
		color: string;
		dayStart: number;
		dayEnd: number;
	} = $props();

	const totalHours = $derived(dayEnd - dayStart);

	// Convert events to positioned bars
	const bars = $derived(
		events
			.filter((e) => !e.all_day)
			.map((e) => {
				const start = Math.max(toFractionalHour(e.start), dayStart);
				const end = Math.min(toFractionalHour(e.end), dayEnd);
				const left = ((start - dayStart) / totalHours) * 100;
				const width = ((end - start) / totalHours) * 100;
				return { ...e, left: `${left}%`, width: `${Math.max(width, 2)}%` };
			})
	);

	const allDayEvents = $derived(events.filter((e) => e.all_day));
</script>

<div class="relative h-6 w-full">
	<!-- Background track -->
	<div class="absolute inset-0 rounded-[6px] bg-[#F5EBDA]/50"></div>

	<!-- All-day indicator: fill entire bar lightly -->
	{#if allDayEvents.length > 0}
		<div
			class="absolute inset-0 rounded-[6px] opacity-30"
			style="background-color: {color}"
			title={allDayEvents.map((e) => e.title).join(', ')}
		></div>
	{/if}

	<!-- Busy blocks -->
	{#each bars as bar}
		<div
			class="absolute top-0.5 bottom-0.5 rounded-[4px] transition-opacity hover:opacity-80"
			style="left: {bar.left}; width: {bar.width}; background-color: {color}"
			title="{bar.title} ({new Date(bar.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(bar.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})"
		></div>
	{/each}
</div>
