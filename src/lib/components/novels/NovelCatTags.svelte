<script lang="ts">
  export let catTags;
  export let type = 'tag';
</script>
<div class="flex gap-3">
{#each catTags as item}
<span class="{type == 'cat' ? 'bg-red-100 text-primary' : 'bg-green-400 text-white'}  px-2 py-1 rounded-full text-xs">
  {item.name}
</span>
{/each}
</div>