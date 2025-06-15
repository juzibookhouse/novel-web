<script lang="ts">
  import { FREE_OPTIONS, type Chapter, type NewNovel } from "$lib/novel";
  import { user } from "$lib/stores/authStore";
  import { supabase, upsertNovel } from "$lib/supabaseClient";
    import Btns from "./Btns.svelte";
    import CheckInput from "./CheckInput.svelte";
    import SelectInput from "./SelectInput.svelte";
    import TextInput from "./TextInput.svelte";

  let error = "";

  export let newNovel: NewNovel = {
    title: "",
    description: "",
    category_id: "",
    tags: [],
    status: "ongoing",
    pen_name: "",
    is_free: ''
  };
  export let categories;
  export let tags;
  export let toggleNovelForm: Function;
  export let fetchNovels: Function;
  export let fetchTags: Function;

  let newTagName = "";
  let authorTag = null;
  let loading = false;

  let chapterOptions:any[] = [];
  if (newNovel?.chapters?.length) {
    chapterOptions = newNovel.chapters.map((chapter:Chapter)=>{
      if (chapter?.quotation) {
        newNovel.quotation = chapter.quotation;
        newNovel.quotation_chapter_id = chapter.id;
      }
      return {
        value: chapter.id,
        label: chapter.title
      }
    });
  }

  const statusOptions = [
    { value: "ongoing", label: "连载中" },
    { value: "finished", label: "已完结" },
  ];

  // Find author's existing tag on component mount
  $: {
    if ($user && tags) {
      authorTag = tags.find((tag) => tag.user_id === $user.id);
    }
  }

  async function handleCoverUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      newNovel.cover_file = input.files[0];
    }
  }

  async function createTag() {
    try {
      if (!newTagName.trim() || !$user?.id) return;
      loading = true;

      const { data: tag, error: tagError } = await supabase
        .from("tags")
        .insert([
          {
            name: newTagName.trim(),
            user_id: $user.id,
          },
        ])
        .select()
        .single();

      if (tagError) throw tagError;

      authorTag = tag;
      newTagName = "";
      await fetchTags();
      newNovel.tags = [...newNovel.tags, tag.id];
    } catch (e: any) {
      // Handle error
    } finally {
      loading = false;
    }
  }

  async function handleUpsertNovel() {
    error = "";
    loading = true;
    
    try {
      if (!$user?.id) throw new Error("请先登录");
      
      // 验证必填字段
      if (!newNovel.title || newNovel.title.trim() === "") {
        throw new Error("作品名称不能为空");
      }
      
      if (!newNovel.category_id) {
        throw new Error("请选择作品类别");
      }

      await upsertNovel($user, newNovel);

      fetchNovels();
      toggleNovelForm();
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
  <div
    class="bg-white rounded-lg overflow-hidden shadow-xl max-w-4xl w-full mx-4"
  >
    <div class="p-4 border-b-2 border-gray-400">
      <h3 class="text-xl font-medium text-gray-900">创作新作品</h3>
    </div>
    <form on:submit|preventDefault={handleUpsertNovel} class="p-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-4">
          <TextInput title="作品名称" field="title" object={newNovel} required={true} />
          {#if newNovel?.chapters?.length > 0}
          <TextInput title="引文" field="quotation" object={newNovel} rows={3} />
          <SelectInput title="引文章节" object={newNovel} field="quotation_chapter_id" options={chapterOptions} />
          {:else}
          <p>引文至少需要一个创建至少一个章节后编辑</p>
          {/if}
          
          <TextInput 
            title="笔名" 
            field="pen_name" 
            object={newNovel}
            bind:value={newNovel.pen_name}
          />
          
          <CheckInput title="发布" object={newNovel} field="published" />
          <SelectInput title="免费阅读" object={newNovel} field="is_free" options={FREE_OPTIONS} />

          <div>
            <label
              for="category"
              class="block text-sm font-medium text-gray-700">类别</label
            >
            <div class="mt-2 space-y-2">
              {#each categories as category}
                <label class="inline-flex items-center mr-4">
                  <input
                    id="category"
                    type="radio"
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
            <label class="block text-sm font-medium text-gray-700" for="tag"
              >标签 (只能创建一个)</label
            >
            {#if !authorTag}
              <div class="mt-2 flex gap-2">
                <input
                  type="text"
                  id="tag"
                  bind:value={newTagName}
                  placeholder="创建您的个人标签"
                  class="flex-1 rounded-md border-2 border-red-200 px-3 py-2"
                />
                <button
                  type="button"
                  on:click={createTag}
                  disabled={loading || !newTagName.trim()}
                  class="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
                >
                  {loading ? "创建中..." : "创建"}
                </button>
              </div>
            {/if}
            <div class="mt-2 space-y-2">
              {#each tags as tag}
                <label class="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    value={tag.id}
                    checked={newNovel.tags.includes(tag.id)}
                    disabled={tag.user_id && tag.user_id !== $user?.id}
                    on:change={(e) => {
                      if (e.target.checked) {
                        newNovel.tags = [...newNovel.tags, tag.id];
                      } else {
                        newNovel.tags = newNovel.tags.filter(
                          (id) => id !== tag.id,
                        );
                      }
                    }}
                    class="form-checkbox h-4 w-4 text-red-600 border-red-300 rounded"
                  />
                  <span class="ml-2">
                    {tag.name}
                    {#if tag.user_id === $user?.id}
                      <span class="text-xs text-red-600">(我的标签)</span>
                    {/if}
                  </span>
                </label>
              {/each}
            </div>
          </div>
        </div>
        <div class="space-y-4">
          
          <SelectInput title="连载状态" object={newNovel} field="status" options={statusOptions} />

          <div>
            <label for="cover" class="block text-sm font-medium text-gray-700"
              >封面图片</label
            >
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
                  on:click={() => (newNovel.cover_url = undefined)}
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
              file:text-red-700
              hover:file:bg-red-100"
            />
          </div>
          <TextInput object={newNovel} title="作品简介" field="description" rows={4} />
        </div>
      </div>
      
      <Btns handleCancel={toggleNovelForm} confirmText={newNovel.id ? "更新" : "创建"} />

    </form>
  </div>
</div>