<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/authStore';
  
  interface Chapter {
    id: string;
    title: string;
    content?: string;
    novel_id: string;
    created_at: string;
  }
  
  interface Novel {
    id: string;
    title: string;
    description: string;
    status: string;
    user_id: string;
    created_at: string;
    category?: string;
    cover_url?: string;
    chapters?: Chapter[];
  }
  
  interface NewNovel {
    id?:string;
    title: string;
    description: string;
    category?: string;
    cover_file?: File;
  }
  
  interface NewChapter {
    title: string;
    content: string;
    novel_id: string | null;
  }
  
  let novels: Novel[] = [];
  let loading: boolean = true;
  let error: string | null = null;
  let uploadProgress: number = 0;
  
  let showNovelForm: boolean = false;
  let showChapterForm: boolean = false;
  let selectedNovel: Novel | null = null;
  let newNovel: NewNovel = {
    title: '',
    description: '',
    category: ''
  };
  let newChapter: NewChapter = {
    title: '',
    content: '',
    novel_id: null
  };

  const categories = [
    '武侠', '仙侠', '历史', '言情', '玄幻', '科幻', '奇幻', '都市'
  ];
  
  onMount(async () => {
    setTimeout(async()=>{
      await fetchNovels();
    },1);
  });
  
  async function fetchNovels() {
    try {
      loading = true;
      console.log($user);
      if (!$user?.id) return;
      const { data, error: fetchError } = await supabase
        .from('novels')
        .select(`
          id,
          title,
          description,
          user_id,
          created_at,
          cover_url,
          chapters (
            id,
            title,
            created_at
          )
        `)
        .eq('user_id', $user?.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      novels = data as Novel[];
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

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
      
      let cover_url = null;
      if (newNovel.cover_file) {
        cover_url = await uploadCover(newNovel.cover_file);
      }

      let upsertResponse
      if (newNovel.id) {
        upsertResponse = await supabase
        .from('novels')
        .update([{
          title: newNovel.title,
          description: newNovel.description,
          // category: newNovel.category,
          cover_url,
        }])
        .eq('id', newNovel.id)
        .select();
      } else {
      upsertResponse = await supabase
        .from('novels')
        .insert([{
          title: newNovel.title,
          description: newNovel.description,
          // category: newNovel.category,
          cover_url,
          user_id: $user.id
        }])
        .select();
      }
      const createError = upsertResponse.error;
      
      if (createError) throw createError;
      
      await fetchNovels();
      showNovelForm = false;
      newNovel = { title: '', description: '', category: '' };
    } catch (e: any) {
      error = e.message;
    }
  }

  const startEditNovel = (novel:Novel) => {
    selectedNovel = novel;
    newNovel = novel;
    showNovelForm = true;
  }
  
  async function createChapter() {
    try {
      if (!selectedNovel?.id) throw new Error('请选择小说');
      
      const { data, error: createError } = await supabase
        .from('chapters')
        .insert([{
          title: newChapter.title,
          content: newChapter.content,
          novel_id: selectedNovel.id,
          chapter_order: (selectedNovel.chapters?.length || 0) + 1
        }])
        .select();
      
      if (createError) throw createError;
      
      await fetchNovels();
      showChapterForm = false;
      newChapter = { title: '', content: '', novel_id: null };
    } catch (e: any) {
      error = e.message;
    }
  }
  
  function startAddChapter(novel: Novel) {
    selectedNovel = novel;
    newChapter.novel_id = novel.id;
    showChapterForm = true;
  }
</script>

<svelte:head>
<title>作家专区 - 墨香书院</title>
<link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
<div class="max-w-7xl mx-auto">
  <div class="text-center mb-12">
    <h1 class="font-['Ma_Shan_Zheng'] text-5xl text-red-800 mb-4">作家专区</h1>
    <p class="text-lg text-red-700">笔墨生花，妙手著文</p>
  </div>

  <div class="flex justify-end mb-8">
    <button
      on:click={() => showNovelForm = true}
      class="bg-red-800 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-full shadow-sm transition duration-200"
    >
      创作新作品
    </button>
  </div>

  {#if error}
    <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
    </div>
  {:else if novels.length === 0}
    <div class="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100">
      <h3 class="text-xl font-medium text-gray-900 mb-2">暂无作品</h3>
      <p class="text-gray-600">开始创作您的第一部作品吧</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-6">
      {#each novels as novel}
        <div class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-lg overflow-hidden">
          <div class="p-6">
            <div class="flex items-start gap-6">
              <div class="w-32 h-44 flex-shrink-0">
                <img
                  src={novel.cover_url || 'https://via.placeholder.com/300x400?text=封面未上传'}
                  alt={novel.title}
                  class="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div class="flex-grow">
                <button
                  on:click={() => startEditNovel(novel)}
                  class="bg-yellow-100 cursor-pointer hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm transition duration-200"
                >
                  编辑
                </button>
                <h3 class="text-2xl font-medium text-gray-900 mb-2">{novel.title}</h3>
                <div class="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>类别：{novel.category || '未分类'}</span>
                  <span>章节：{novel.chapters?.length || 0}</span>
                </div>
                <p class="text-gray-700">{novel.description}</p>
                <div class="mt-4">
                  <button
                    on:click={() => startAddChapter(novel)}
                    class="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-full text-sm transition duration-200"
                  >
                    添加新章节
                  </button>
                </div>
              </div>
            </div>
          </div>
          {#if novel.chapters && novel.chapters.length > 0}
            <div class="border-t-2 border-red-100 px-6 py-4">
              <h4 class="text-lg font-medium text-gray-900 mb-4">章节列表</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each novel.chapters as chapter}
                  <a
                    href={`/novel/${novel.id}/chapter/${chapter.id}`}
                    class="group p-3 rounded-lg border-2 border-red-100 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                  >
                    <h5 class="text-gray-900 group-hover:text-red-800 transition-colors duration-200">
                      {chapter.title}
                    </h5>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Novel Modal -->
{#if showNovelForm}
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
            <label for="category" class="block text-sm font-medium text-gray-700">类别</label>
            <select
              id="category"
              bind:value={newNovel.category}
              class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
            >
              <option value="">请选择类别</option>
              {#each categories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="cover" class="block text-sm font-medium text-gray-700">封面图片</label>
            <input
              type="file"
              id="cover"
              accept="image/*"
              on:change={handleCoverUpload}
              class="mt-1 block w-full text-sm text-gray-500
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
            on:click={() => showNovelForm = false}
            class="px-4 py-2 border-2 border-red-200 text-red-800 rounded-md hover:bg-red-50"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700"
          >
            {newNovel.id ? '更新' : '创建'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Create Chapter Modal -->
{#if showChapterForm && selectedNovel}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-lg w-full mx-4">
      <div class="px-6 py-4 border-b-2 border-red-100">
        <h3 class="text-xl font-medium text-gray-900">添加新章节 - {selectedNovel.title}</h3>
      </div>
      <form on:submit|preventDefault={createChapter} class="px-6 py-4">
        <div class="space-y-4">
          <div>
            <label for="chapter-title" class="block text-sm font-medium text-gray-700">章节标题</label>
            <input
              type="text"
              id="chapter-title"
              bind:value={newChapter.title}
              required
              class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
              placeholder="请输入章节标题"
            />
          </div>
          <div>
            <label for="content" class="block text-sm font-medium text-gray-700">章节内容</label>
            <textarea
              id="content"
              bind:value={newChapter.content}
              rows="12"
              class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
              placeholder="请输入章节内容"
            ></textarea>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            on:click={() => showChapterForm = false}
            class="px-4 py-2 border-2 border-red-200 text-red-800 rounded-md hover:bg-red-50"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700"
          >
            创建
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
</div>

<style>
:global(body) {
  background-color: #FEF2F2;
}
</style>