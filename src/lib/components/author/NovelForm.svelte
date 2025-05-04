<script lang="ts">
    import type { NewNovel } from "$lib/novel";
    import { user } from "$lib/stores/authStore";
    import { supabase } from "$lib/supabaseClient";

  export let newNovel: NewNovel = {
    title: '',
    description: '',
    categories: [],
    tags: [],
    status: 'ongoing'
  };
  export let categories;
  export let tags;
  export let toggleNovelForm:Function;
  export let fetchNovels:Function;

  const statusOptions = [
    { value: 'ongoing', label: '连载中' },
    { value: 'finished', label: '已完结' }
  ];

  async function handleCoverUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      newNovel.cover_file = input.files[0];
    }
  }

  async function uploadCover(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `novel-covers/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('covers')
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function upsertNovel() {
    try {
      if (!$user?.id) throw new Error('请先登录');
      
      let cover_url = newNovel.cover_url;
      if (newNovel.cover_file) {
        cover_url = await uploadCover(newNovel.cover_file);
      }

      let novelId = newNovel.id;
      if (!novelId) {
        // Insert new novel
        const { data: novel, error: novelError } = await supabase
          .from('novels')
          .insert([{
            title: newNovel.title,
            description: newNovel.description,
            status: newNovel.status,
            is_free: newNovel.is_free,
            category_id: newNovel.category_id,
            cover_url,
            user_id: $user.id
          }])
          .select()
          .single();

        if (novelError) throw novelError;
        novelId = novel.id;
      } else {
        // Update existing novel
        const { error: updateError } = await supabase
          .from('novels')
          .update({
            title: newNovel.title,
            description: newNovel.description,
            category_id: newNovel.category_id,
            status: newNovel.status,
            is_free: newNovel.is_free,
            cover_url,
          })
          .eq('id', novelId);

        if (updateError) throw updateError;
      }

      // Delete existing tags
      if (novelId) {
        await supabase
          .from('novel_tags')
          .delete()
          .eq('novel_id', novelId);
      }

      // Insert new tags
      if (newNovel.tags.length > 0) {
        const tagLinks = newNovel.tags.map(tagId => ({
          novel_id: novelId,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('novel_tags')
          .insert(tagLinks);

        if (tagError) throw tagError;
      }
      
      fetchNovels();
      toggleNovelForm();
    } catch (e: any) {
      // error = e.message;
    }
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-lg w-full mx-4">
      <div class="px-6 py-4 border-b-2 border-red-100">
        <h3 class="text-xl font-medium text-gray-900">创作新作品</h3>
      </div>
      <form on:submit|preventDefault={upsertNovel} class="px-6 py-4">
        <div class="space-y-4">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700">作品名称</label>
            <input
              type="text"
              id="title"
              bind:value={newNovel.title}
              required
              class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
              placeholder="请输入作品名称"
            />
          </div>
          <div>
            <label for="is_free" class="block text-sm font-medium text-gray-700">免费阅读？</label>
            <input
              type="checkbox"
              id="is_free"
              bind:checked={newNovel.is_free}
              class=""
            />
          </div>
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700">类别</label>
            <div class="mt-2 space-y-2">
              {#each categories as category}
                <label class="inline-flex items-center mr-4">
                  <input
                    id="category"
                    type="checkbox"
                    value={category.id}
                    checked={newNovel.category_id === category?.id}
                    on:change={(e) => {
                      newNovel.category_id = category?.id;
                    }}
                    class="form-checkbox h-4 w-4 text-red-600 border-red-300 rounded"
                  />
                  <span class="ml-2">{category.name}</span>
                </label>
              {/each}
            </div>
          </div>
          <div>
            <label for="tags" class="block text-sm font-medium text-gray-700">标签</label>
            <div class="mt-2 space-y-2">
              {#each tags as tag}
                <label class="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    value={tag.id}
                    checked={newNovel.tags.includes(tag.id)}
                    on:change={(e) => {
                      if (e && e.target?.checked) {
                        newNovel.tags = [...newNovel.tags, tag.id];
                      } else {
                        newNovel.tags = newNovel.tags.filter(id => id !== tag.id);
                      }
                    }}
                    class="form-checkbox h-4 w-4 text-red-600 border-red-300 rounded"
                  />
                  <span class="ml-2">{tag.name}</span>
                </label>
              {/each}
            </div>
          </div>
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700">连载状态</label>
            <select
              id="status"
              bind:value={newNovel.status}
              class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
            >
              {#each statusOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="cover" class="block text-sm font-medium text-gray-700">封面图片</label>
            {#if newNovel.cover_url}
              <div class="mt-2 relative w-32">
                <img
                  src={newNovel.cover_url}
                  alt="当前封面"
                  class="w-full h-44 object-cover rounded-lg"
                />
                <button
                  type="button"
                  class="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  on:click={() => newNovel.cover_url = undefined}
                >
                  ✕
                </button>
              </div>
            {/if}
            <input
              type="file"
              id="cover"
              accept="image/*"
              on:change={handleCoverUpload}
              class="mt-2 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-red-50 file:text-red-700
                hover:file:bg-red-100"
            />
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">作品简介</label>
            <textarea
              id="description"
              bind:value={newNovel.description}
              rows="4"
              class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
              placeholder="请输入作品简介"
            ></textarea>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            on:click={() => toggleNovelForm()}
            class="px-4 py-2 border-2 rounded-md"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-[#FEF9D5] text-white rounded-md hover:bg-red-700"
          >
            {newNovel.id ? '更新' : '创建'}
          </button>
        </div>
      </form>
    </div>
  </div>