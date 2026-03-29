<script lang="ts">
	import type { PageData } from './$types';
	import { MEMBER_COLORS } from '$lib/types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Setup - Family Calendar</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-[#FDF6EC] font-sans">
	<div class="mx-auto max-w-2xl px-4 py-8">
		<h1 class="mb-8 text-3xl font-bold text-[#3A3530]">Family Calendar Setup</h1>

		<!-- Status messages -->
		{#if data.connected}
			<div class="mb-6 rounded-[12px] bg-green-50 px-4 py-3 text-sm text-green-700">
				Successfully connected {data.connected === 'google' ? 'Google' : 'Outlook'} Calendar!
			</div>
		{/if}
		{#if data.error}
			<div class="mb-6 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">
				Error: {data.error}
			</div>
		{/if}

		{#if !data.family}
			<!-- Create Family -->
			<div class="rounded-[12px] bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-[#3A3530]">Create Your Family</h2>
				<p class="mb-4 text-sm text-[#6B6560]">
					Choose a name for your family calendar.
				</p>
				<form method="POST" action="?/createFamily" use:enhance>
					<div class="flex gap-3">
						<input
							name="name"
							type="text"
							placeholder="e.g. The Johnsons"
							required
							class="flex-1 rounded-[12px] border border-[#F5EBDA] px-4 py-3 text-[#3A3530] placeholder-[#9C9590] focus:border-[#E8786B] focus:outline-none"
						/>
						<button
							type="submit"
							class="rounded-[12px] bg-[#E8786B] px-6 py-3 font-semibold text-white transition hover:bg-[#D66B5E]"
						>
							Create
						</button>
					</div>
				</form>
			</div>
		{:else}
			<!-- Family exists — manage members -->
			<div class="space-y-6">
				<!-- Back to calendar -->
				<a
					href="/"
					class="inline-flex items-center gap-1 text-sm font-medium text-[#E8786B] hover:underline"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
					Back to Calendar
				</a>

				<!-- Current Members -->
				<div class="rounded-[12px] bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-[#3A3530]">Family Members</h2>

					{#if data.members.length === 0}
						<p class="text-sm text-[#9C9590]">No members added yet. Add family members below.</p>
					{:else}
						<div class="space-y-3">
							{#each data.members as member}
								<div class="flex items-center justify-between rounded-[12px] border border-[#F5EBDA] px-4 py-3">
									<div class="flex items-center gap-3">
										<span
											class="inline-block h-4 w-4 rounded-full"
											style="background-color: {member.color}"
										></span>
										<span class="font-medium text-[#3A3530]">{member.name}</span>
										<span class="rounded-[6px] bg-[#F5EBDA] px-2 py-0.5 text-xs text-[#6B6560]">
											{member.provider === 'google' ? 'Google' : 'Outlook'}
										</span>
										{#if member.encrypted_tokens}
											<span class="text-xs text-green-600">Connected</span>
										{:else}
											<a
												href="/auth/{member.provider}/start?memberId={member.id}"
												class="rounded-[6px] bg-[#E8786B] px-3 py-1 text-xs font-medium text-white hover:bg-[#D66B5E]"
											>
												Connect Calendar
											</a>
										{/if}
									</div>
									<form method="POST" action="?/removeMember" use:enhance>
										<input type="hidden" name="memberId" value={member.id} />
										<button
											type="submit"
											class="text-xs text-[#9C9590] hover:text-red-500"
											title="Remove member"
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</form>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Add Member -->
				<div class="rounded-[12px] bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-[#3A3530]">Add Family Member</h2>
					<form method="POST" action="?/addMember" use:enhance class="space-y-4">
						<div>
							<label for="member-name" class="mb-1 block text-sm font-medium text-[#6B6560]">Name</label>
							<input
								id="member-name"
								name="name"
								type="text"
								placeholder="e.g. Dad, Mom, Emma"
								required
								class="w-full rounded-[12px] border border-[#F5EBDA] px-4 py-3 text-[#3A3530] placeholder-[#9C9590] focus:border-[#E8786B] focus:outline-none"
							/>
						</div>

						<div>
							<label class="mb-2 block text-sm font-medium text-[#6B6560]">Color</label>
							<div class="flex flex-wrap gap-2">
								{#each MEMBER_COLORS as c, i}
									<label class="cursor-pointer">
										<input
											type="radio"
											name="color"
											value={c.value}
											required
											class="peer sr-only"
											checked={i === 0}
										/>
										<span
											class="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-transparent transition peer-checked:border-[#3A3530] peer-checked:ring-2 peer-checked:ring-[#3A3530]/20"
											style="background-color: {c.value}"
											title={c.name}
										></span>
									</label>
								{/each}
							</div>
						</div>

						<div>
							<label class="mb-2 block text-sm font-medium text-[#6B6560]">Calendar Provider</label>
							<div class="flex gap-3">
								<label class="cursor-pointer">
									<input type="radio" name="provider" value="google" required class="peer sr-only" checked />
									<span class="inline-flex items-center gap-2 rounded-[12px] border-2 border-[#F5EBDA] px-4 py-3 transition peer-checked:border-[#E8786B] peer-checked:bg-[#FDF6EC]">
										<svg class="h-5 w-5" viewBox="0 0 24 24">
											<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
											<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
											<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
											<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
										</svg>
										<span class="text-sm font-medium text-[#3A3530]">Google</span>
									</span>
								</label>
								<label class="cursor-pointer">
									<input type="radio" name="provider" value="outlook" class="peer sr-only" />
									<span class="inline-flex items-center gap-2 rounded-[12px] border-2 border-[#F5EBDA] px-4 py-3 transition peer-checked:border-[#E8786B] peer-checked:bg-[#FDF6EC]">
										<svg class="h-5 w-5" viewBox="0 0 24 24">
											<path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.583a.793.793 0 01-.583.238h-8.304V6.566h8.304c.23 0 .424.08.583.238.159.159.238.353.238.583zM13.623 2v20L0 18.66V5.34L13.623 2z"/>
											<ellipse fill="#fff" cx="6.812" cy="12" rx="3.5" ry="4.5"/>
										</svg>
										<span class="text-sm font-medium text-[#3A3530]">Outlook</span>
									</span>
								</label>
							</div>
						</div>

						<button
							type="submit"
							class="w-full rounded-[12px] bg-[#E8786B] px-6 py-3 font-semibold text-white transition hover:bg-[#D66B5E]"
						>
							Add Member
						</button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
