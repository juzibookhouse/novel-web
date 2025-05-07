<script lang="ts">
  import NovelCard from "./NovelCard.svelte";
  export let novels;

</script>
<!-- Novel Grid -->
<div class="grid grid-cols-4 gap-6 mb-8">
  {#each novels as novel}
    <NovelCard {novel} />
  {/each}
</div>
