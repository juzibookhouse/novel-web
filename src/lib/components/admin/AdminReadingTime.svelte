<script lang="ts">
    import { formatDuration } from "$lib/novel";
  import { supabase } from "$lib/supabaseClient";
  import { onMount } from "svelte";

  let selectedMonth = new Date().toISOString().slice(0, 7); // 默认选择当前月份
  let selectedFilter = "user"; // 'user' or 'novel'
  let readingData: any[] = [];
  let loading = false;
  let error: string | null = null;

  async function fetchReadingData() {
    try {
      loading = true;
      error = null;

      const startDate = new Date(selectedMonth + "-01");
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      let query = supabase
        .from('reading_records')
        .select(`
          id,
          reading_time,
          user_profiles (
            id,
            user_name
          ),
          novels (
            id,
            title
          )
        `)
        .eq('date', selectedMonth);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // 根据选择的过滤方式处理数据
      const aggregatedData = new Map();

      data.forEach((record: any) => {
        const key = selectedFilter === 'user'
          ? record.user_profiles.user_name
          : record.novels.title;
        
        if (!aggregatedData.has(key)) {
          aggregatedData.set(key, {
            name: key,
            totalTime: 0,
          });
        }

        const entry = aggregatedData.get(key);
        entry.totalTime += record.reading_time;
      });

      readingData = Array.from(aggregatedData.values())
        .sort((a, b) => b.totalTime - a.totalTime);

    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  // 当月份或过滤方式改变时重新获取数据
  $: {
    if (selectedMonth && selectedFilter) {
      fetchReadingData();
    }
  }
</script>

<div class="p-6">
  <div class="flex gap-4 mb-6">
    <div class="flex-1">
      <label for="month" class="block text-sm font-medium text-gray-700 mb-1">选择月份</label>
      <input
        type="month"
        id="month"
        bind:value={selectedMonth}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
      />
    </div>
    <div class="flex-1">
      <label for="filter" class="block text-sm font-medium text-gray-700 mb-1">筛选方式</label>
      <select
        id="filter"
        bind:value={selectedFilter}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
      >
        <option value="user">按用户统计</option>
        <option value="novel">按小说统计</option>
      </select>
    </div>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
    </div>
  {:else}
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        {#each readingData as data}
          <li class="px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">{data.name}</p>
              </div>
              <div class="text-sm text-gray-500">
                阅读时间：{formatDuration(data.totalTime)}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>