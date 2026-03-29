<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let editingId: string | null = $state(null);
	let editName: string = $state('');

	function startEdit(id: string, currentName: string) {
		editingId = id;
		editName = currentName;
	}

	function cancelEdit() {
		editingId = null;
		editName = '';
	}
</script>

<svelte:head>
	<title>Admin - Family Calendar</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-[#FDF6EC] font-sans">
	<div class="mx-auto max-w-3xl px-4 py-8">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-3xl font-bold text-[#3A3530]">Admin</h1>
			<a
				href="/"
				class="rounded-[12px] bg-white px-4 py-2 text-sm font-medium text-[#6B6560] shadow-sm transition hover:shadow-md"
			>
				← Back to Calendar
			</a>
		</div>

		<div class="rounded-[12px] bg-white p-6 shadow-sm">
			<h2 class="mb-1 text-xl font-semibold text-[#3A3530]">Families</h2>
			<p class="mb-6 text-sm text-[#9C9590]">{data.families.length} total</p>

			{#if data.families.length === 0}
				<p class="text-sm text-[#9C9590]">No families found.</p>
			{:else}
				<div class="space-y-4">
					{#each data.families as family}
						<div class="rounded-[12px] border border-[#F5EBDA] p-4">
							{#if editingId === family.id}
								<!-- Edit mode -->
								<form
									method="POST"
									action="?/rename"
									use:enhance={() => () => cancelEdit()}
									class="flex items-center gap-3"
								>
									<input type="hidden" name="familyId" value={family.id} />
									<input
										name="name"
										type="text"
										bind:value={editName}
										required
										class="flex-1 rounded-[12px] border border-[#F5EBDA] px-3 py-2 text-sm text-[#3A3530] focus:border-[#E8786B] focus:outline-none"
									/>
									<button
										type="submit"
										class="rounded-[12px] bg-[#E8786B] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#D66B5E]"
									>
										Save
									</button>
									<button
										type="button"
										onclick={cancelEdit}
										class="rounded-[12px] bg-[#F5EBDA] px-4 py-2 text-sm font-medium text-[#6B6560] transition hover:bg-[#EBD9C0]"
									>
										Cancel
									</button>
								</form>
							{:else}
								<!-- View mode -->
								<div class="flex items-start justify-between gap-4">
									<div>
										<div class="font-semibold text-[#3A3530]">{family.name}</div>
										<div class="mt-1 text-xs text-[#9C9590]">
											{family.member_count} member{family.member_count !== 1 ? 's' : ''}
											· Created {new Date(family.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</div>
										{#if family.members.length > 0}
											<div class="mt-2 flex flex-wrap gap-1">
												{#each family.members as member}
													<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style="background-color: {member.color}22; color: {member.color}">
														<span class="inline-block h-2 w-2 rounded-full" style="background-color: {member.color}"></span>
														{member.name}
														{#if member.encrypted_tokens}
															<span title="Connected">✓</span>
														{/if}
													</span>
												{/each}
											</div>
										{/if}
									</div>

									<div class="flex shrink-0 gap-2">
										<button
											onclick={() => startEdit(family.id, family.name)}
											class="rounded-[12px] bg-[#F5EBDA] px-3 py-1.5 text-xs font-medium text-[#6B6560] transition hover:bg-[#EBD9C0]"
										>
											Rename
										</button>
										<form
											method="POST"
											action="?/delete"
											use:enhance
											onsubmit={(e) => {
												if (!confirm(`Delete "${family.name}" and all its members?`)) e.preventDefault();
											}}
										>
											<input type="hidden" name="familyId" value={family.id} />
											<button
												type="submit"
												class="rounded-[12px] bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
											>
												Delete
											</button>
										</form>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
