<script lang="ts">
    import { goto } from "$app/navigation";

  export let data;
  let searchTerm = data.search || '';
  let selectedCategory = data.selectedCategory || '';
  let selectedStatus = data.selectedStatus || '';

  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    params.set('page', page.toString());
    goto(`/novels?${params.toString()}`);
  }
</script>
<!-- Pagination -->
{#if data.totalPages > 1}
<div class="flex justify-center gap-2">
  {#each Array(data.totalPages) as _, i}
    <button
      class="px-4 py-2 rounded-lg {data.currentPage === i + 1
        ? 'bg-[#FEF9D5] text-white shadow-md'
        : 'bg-white text-primary hover:bg-red-50'} 
        border-2 border-gray-400 transition-all duration-200 hover:shadow-md"
      on:click={() => goToPage(i + 1)}
    >
      {i + 1}
    </button>
  {/each}
</div>
{/if}