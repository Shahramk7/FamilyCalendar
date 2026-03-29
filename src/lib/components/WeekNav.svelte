<script lang="ts">
	import type { ViewMode } from '$lib/types';
	import { formatWeekRange } from '$lib/utils';

	let {
		weekStart,
		viewMode,
		selectedDate,
		onBackToWeek
	}: {
		weekStart: Date;
		viewMode: ViewMode;
		selectedDate: Date | null;
		onBackToWeek: () => void;
	} = $props();

	function toLocalDateStr(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function prevWeek() {
		const prev = new Date(weekStart);
		prev.setDate(prev.getDate() - 7);
		window.location.href = `/?week=${toLocalDateStr(prev)}`;
	}

	function nextWeek() {
		const next = new Date(weekStart);
		next.setDate(next.getDate() + 7);
		window.location.href = `/?week=${toLocalDateStr(next)}`;
	}

	function goToday() {
		window.location.href = '/';
	}

	const dayLabel = $derived(
		selectedDate
			? selectedDate.toLocaleDateString('en-US', {
					weekday: 'long',
					month: 'long',
					day: 'numeric'
				})
			: ''
	);
</script>

<div class="flex items-center justify-between">
	<div class="flex items-center gap-3">
		{#if viewMode === 'day'}
			<button
				onclick={onBackToWeek}
				class="flex items-center gap-1 rounded-[12px] bg-white px-3 py-2 text-sm font-medium text-[#6B6560] shadow-sm transition hover:shadow-md"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				Week
			</button>
		{/if}

		<h2 class="text-lg font-semibold text-[#3A3530]">
			{#if viewMode === 'week'}
				{formatWeekRange(weekStart)}
			{:else}
				{dayLabel}
			{/if}
		</h2>
	</div>

	{#if viewMode === 'week'}
		<div class="flex items-center gap-2">
			<button
				onclick={prevWeek}
				class="rounded-[12px] bg-white p-2 text-[#6B6560] shadow-sm transition hover:shadow-md"
				aria-label="Previous week"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<button
				onclick={goToday}
				class="rounded-[12px] bg-white px-3 py-2 text-sm font-medium text-[#6B6560] shadow-sm transition hover:shadow-md"
			>
				Today
			</button>
			<button
				onclick={nextWeek}
				class="rounded-[12px] bg-white p-2 text-[#6B6560] shadow-sm transition hover:shadow-md"
				aria-label="Next week"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	{/if}
</div>
