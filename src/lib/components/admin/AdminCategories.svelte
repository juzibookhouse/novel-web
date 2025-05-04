<script lang="ts">
    import type { Category } from '$lib/novel';
  import { supabase } from '$lib/supabaseClient';
    import { onMount } from 'svelte';
  let categories: Category[] = [];

  // New category form
  let newCategoryName = '';
  let addingCategory = false;

  onMount(()=> {
    fetchCategories();
  });

  async function fetchCategories() {
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

      if (categoriesError) throw categoriesError;
      categories = categoriesData;
    } catch (e) {

    }
    
  }

  async function addCategory() {
    try {
      if (!newCategoryName.trim()) return;
      
      addingCategory = true;
      const { error: categoryError } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }]);

      if (categoryError) throw categoryError;
      
      newCategoryName = '';
      await fetchCategories();
    } catch (e: any) {
      // error = e.message;
    } finally {
      addingCategory = false;
    }
  }

  async function deleteCategory(categoryId: string) {
    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) throw deleteError;
      await fetchCategories();
    } catch (e: any) {
      // error = e.message;
    }
  }

</script>
<div class="p-6">
  <div class="mb-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">添加新分类</h3>
    <div class="flex gap-4">
      <input
        type="text"
        bind:value={newCategoryName}
        placeholder="输入分类名称"
        class="flex-1 rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
      />
      <button
        on:click={addCategory}
        disabled={addingCategory || !newCategoryName.trim()}
        class="px-6 py-2 rounded-md disabled:opacity-50"
      >
        {addingCategory ? "添加中..." : "添加"}
      </button>
    </div>
  </div>

  <table class="min-w-full divide-y divide-red-100">
    <thead>
      <tr>
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >分类名称</th
        >
        <th
          class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
          >操作</th
        >
      </tr>
    </thead>
    <tbody class="divide-y divide-red-100">
      {#each categories as category}
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >{category.name}</td
          >
          <td
            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
          >
            <button
              on:click={() => deleteCategory(category.id)}
              class="text-red-600 hover:text-primary"
            >
              删除
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
