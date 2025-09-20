<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { goto } from '$app/navigation';
    import NovelList from '$lib/components/novels/NovelList.svelte';
    import SearchFilters from '$lib/components/novels/SearchFilters.svelte';
    import Pagination from '$lib/components/novels/Pagination.svelte';
  
  export let data;
</script>

<svelte:head>
  <title>{WEBSITE_NAME} - 书库</title>
</svelte:head>

<div class="min-h-screen py-8 px-4">
  <div class="max-w-7xl mx-auto">

    <SearchFilters data={data} />

    <NovelList novels={data.novels} />

    <Pagination data={data} />
  </div>
</div>