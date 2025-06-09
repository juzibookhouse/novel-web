<script lang="ts">
  import type { Tag } from "$lib/novel";
  import { user } from "$lib/stores/authStore";
  import { supabase } from "$lib/supabaseClient";
  import { onMount } from "svelte";
  import Btn from "../common/Btn.svelte";
  let tags: Tag[] = [];

  // New category form
  let newTagName = "";
  let addingTag = false;

  onMount(() => {
    fetchTags();
  });

  async function fetchTags() {
    try {
      // Load tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select(
          `
            *,
            user_profiles (
              user_name
            )
          `,
        )
        .order("name");

      if (tagsError) throw tagsError;
      tags = tagsData.map(({ id, name, user_profiles }) => {
        return {
          id,
          name,
          user_name: user_profiles ? user_profiles.user_name : "",
        };
      });
    } catch (e) {}
  }

  async function addTag() {
    try {
      if (!newTagName.trim()) return;

      addingTag = true;
      const { error: tagError } = await supabase
        .from("tags")
        .insert([{ name: newTagName.trim(), user_id: $user?.id }]);

      if (tagError) throw tagError;

      newTagName = "";
      await fetchTags();
    } catch (e: any) {
      // error = e.message;
    } finally {
      addingTag = false;
    }
  }

  async function delTag(tagId: string) {
    try {
      const { error: deleteError } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId);

      if (deleteError) throw deleteError;
      await fetchTags();
    } catch (e: any) {
      // error = e.message;
    }
  }
</script>

<div class="p-6">
  <div class="mb-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">添加新标签</h3>
    <div class="flex gap-4">
      <input
        type="text"
        bind:value={newTagName}
        placeholder="输入分类名称"
        class="flex-1 rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
      />
      <!-- <button
        on:click={addTag}
        disabled={addingTag || !newTagName.trim()}
        class="px-6 py-2 rounded-md disabled:opacity-50"
      >
        {addingTag ? "添加中..." : "添加"}
      </button> -->
      <Btn handleClick={addTag} disabled={addingTag || !newTagName.trim()} title={addingTag ? "添加中..." : "添加"} />
    </div>
  </div>

  <table class="min-w-full divide-y divide-red-100">
    <thead>
      <tr>
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >标签名称</th
        >
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >作家</th
        >
        <th
          class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
          >操作</th
        >
      </tr>
    </thead>
    <tbody class="divide-y divide-red-100">
      {#each tags as tag}
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >{tag.name}</td
          >
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >{tag.user_name}</td
          >
          <td
            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
          >
            <button
              on:click={() => delTag(tag.id)}
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
