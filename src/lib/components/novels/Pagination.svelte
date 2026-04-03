<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";

  export let data;

  $: searchTerm = $page.url.searchParams.get('search') || '';
  $: selectedCategory = $page.url.searchParams.get('category') || '';
  $: selectedStatus = $page.url.searchParams.get('status') || '';
  $: isShort = $page.url.searchParams.get('is_short') || '';

  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    if (isShort) params.set('is_short', isShort);

    params.set('page', page.toString());
    return goto(`/novels?${params.toString()}`);
  }
</script>
<!-- Pagination -->
{#if data.totalPages > 1}
<div class="flex justify-center gap-2">
  {#each Array(data.totalPages) as _, i}
    <button
      class="px-4 py-2 cursor-pointer rounded {data.currentPage === i + 1
        ? 'bg-[#FEF9D5] shadow-md'
        : 'bg-white text-primary hover:'} 
        border-2 border-gray-400 transition-all duration-200 hover:shadow-md"
      on:click={() => goToPage(i + 1)}
    >
      {i + 1}
    </button>
  {/each}
</div>
{/if}