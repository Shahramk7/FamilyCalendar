<script lang="ts">
	import type { Member } from '$lib/types';

	let { members }: { members: Member[] } = $props();
</script>

<div class="mt-6 flex flex-wrap items-center gap-4">
	{#each members as member}
		<div class="flex items-center gap-2">
			<span
				class="inline-block h-3 w-3 rounded-full"
				style="background-color: {member.color}"
			></span>
			<span class="text-sm font-medium text-[#6B6560]">{member.name}</span>
			{#if !member.encrypted_tokens}
				<span class="text-xs text-[#9C9590]">(not connected)</span>
			{/if}
		</div>
	{/each}
</div>
