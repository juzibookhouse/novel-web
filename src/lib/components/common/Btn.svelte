<script lang='ts'>
  export let handleClick, title;
</script>
<button
  on:click={handleClick}
  class="px-4 py-2 rounded-full transition-colors cursor-pointer">
  {title}
</button>
