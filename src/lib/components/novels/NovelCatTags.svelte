<script lang="ts">
  export let catTags;
  export let type = 'tag';
  
  const CSS_TYPES:{[key:string]:string} = {
    'tag': 'bg-green-400 text-white',
    'cat': 'bg-red-100 text-primary',
    'ongoing': 'bg-orange-500 text-white',
    'finished': 'bg-green-600 text-white'
  };
  
  let cssClass = CSS_TYPES[type];
</script>
<div class="flex gap-2">
{#each catTags as item}
<span class="{cssClass}  px-2 py-1 rounded text-xs">
  {item.name}
</span>
{/each}
</div>