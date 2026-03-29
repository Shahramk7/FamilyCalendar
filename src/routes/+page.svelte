<script lang="ts">
	import type { PageData } from './$types';
	import type { ViewMode } from '$lib/types';
	import WeekView from '$lib/components/WeekView.svelte';
	import DayView from '$lib/components/DayView.svelte';
	import WeekNav from '$lib/components/WeekNav.svelte';
	import MemberLegend from '$lib/components/MemberLegend.svelte';

	let { data }: { data: PageData } = $props();

	let viewMode: ViewMode = $state('week');
	let selectedDate: Date | null = $state(null);

	function handleDayClick(date: Date) {
		if (viewMode === 'week') {
			viewMode = 'day';
			selectedDate = date;
		} else {
			viewMode = 'week';
			selectedDate = null;
		}
	}

	function backToWeek() {
		viewMode = 'week';
		selectedDate = null;
	}

	function handleDayNavigate(date: Date) {
		selectedDate = date;
	}
</script>

<svelte:head>
	<title>{data.family.name} - Family Calendar</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-[#FDF6EC] font-sans">
	<!-- Header -->
	<header class="mx-auto max-w-7xl px-4 pt-6 pb-4">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold text-[#3A3530]">{data.family.name}</h1>
			<a
				href="/setup"
				class="rounded-[20px] bg-white px-4 py-2 text-sm font-medium text-[#6B6560] shadow-sm transition hover:shadow-md"
			>
				Settings
			</a>
		</div>
	</header>

	<!-- Navigation -->
	<div class="mx-auto max-w-7xl px-4 pb-4">
		<WeekNav
			weekStart={new Date(data.weekStart)}
			{viewMode}
			{selectedDate}
			onBackToWeek={backToWeek}
		/>
	</div>

	<!-- Calendar Views -->
	<main class="mx-auto max-w-7xl px-4 pb-8">
		{#if viewMode === 'week'}
			<WeekView
				weekStart={new Date(data.weekStart)}
				members={data.members}
				events={data.events}
				meals={data.meals}
				onDayClick={handleDayClick}
			/>
		{:else if selectedDate}
			<DayView
				date={selectedDate}
				members={data.members}
				events={data.events}
				onDayClick={handleDayClick}
				onNavigateDay={handleDayNavigate}
			/>
		{/if}

		<!-- Legend -->
		<MemberLegend members={data.members} />
	</main>
</div>
