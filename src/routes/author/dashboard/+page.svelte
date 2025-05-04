<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/authStore';
  import { WEBSITE_NAME } from '$lib/constants';
  import Quill from 'quill';
  import type { Category, NewNovel, NewChapter, Novel } from '$lib/novel';
    import NovelForm from '$lib/components/author/NovelForm.svelte';
  
  const EMPTY_NOVEL:NewNovel = {
    title: '',
    description: '',
    categories: [],
    status: 'ongoing'
  };
  
  let novels: Novel[] = [];
  let categories: Category[] = [];
  let loading: boolean = true;
  let error: string | null = null;
  let uploadProgress: number = 0;
  
  let showNovelForm: boolean = false;
  
  function toggleNovelForm() {
    showNovelForm = !showNovelForm;
    newNovel = EMPTY_NOVEL;
  }
  
  let showChapterForm: boolean = false;
  let selectedNovel: Novel | null = null;
  let newNovel = EMPTY_NOVEL;
  let newChapter: NewChapter = {
    id: '',
    title: '',
    content: '',
    novel_id: null
  };

  let newCategoryName: string = '';
  
  onMount(async () => {
    supabase.auth.onAuthStateChange((event, session) => {
      fetchNovels(),
      fetchCategories()
    });
  });

  function initialChapterEditor() {
    setTimeout(()=>{
      const quill = new Quill('#chapterEditor', {
        theme: 'snow'
      });
    },1);
  }

  async function fetchCategories() {
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (fetchError) {
      console.error('Error fetching categories:', fetchError);
      return;
    }
    
    categories = data || [];
  }
  
  async function fetchNovels() {
    try {
      loading = true;
      if (!$user?.id) return;
      const { data, error: fetchError } = await supabase
        .from('novels')
        .select(`
          id,
          title,
          description,
          status,
          user_id,
          is_free,
          created_at,
          cover_url,
          chapters (
            id,
            title,
            content,
            is_free,
            created_at
          ),
          novel_categories (
            categories (
              id,
              name
            )
          )
        `)
        .eq('user_id', $user?.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      novels = (data || []).map(novel => ({
        ...novel,
        categories: novel.novel_categories?.map(nc => nc.categories)
      }));
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }


  const startEditNovel = (novel: Novel) => {
    selectedNovel = novel;
    newNovel = {
      ...novel,
      categories: novel.categories?.map(c => c.id) || []
    };
    showNovelForm = true;
  }
  
  async function createChapter() {
    try {
      if (!selectedNovel?.id) throw new Error('请选择小说');
      if (newChapter.id) {
        // Update existing chapter
        const { error: updateError } = await supabase
          .from('chapters')
          .update({
            title: newChapter.title,
            content: newChapter.content,
            is_free: newChapter.is_free
          })
          .eq('id', newChapter.id);
          
        if (updateError) throw updateError;
      } else {
        // Create new chapter
        const { data, error: createError } = await supabase
          .from('chapters')
          .insert([{
            title: newChapter.title,
            content: newChapter.content,
            is_free: newChapter.is_free,
            novel_id: newChapter.novel_id,
            chapter_order: (selectedNovel.chapters?.length || 0) + 1
          }])
          .select();
      
      if (createError) throw createError;
      }
      
      await fetchNovels();
      showChapterForm = false;
      newChapter = { id: '', title: '', content: '', novel_id: null };
    } catch (e: any) {
      error = e.message;
    }
  }
  
  function startAddChapter(novel: Novel) {
    selectedNovel = novel;
    newChapter.id = '';
    newChapter.title = '';
    newChapter.content = '';
    newChapter.novel_id = novel.id;
    showChapterForm = true;
    initialChapterEditor();
  }
</script>

<svelte:head>
<title>作家专区 - {WEBSITE_NAME}</title>
<link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
</svelte:head>

<div class="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
<div class="max-w-7xl mx-auto">
  <div class="text-center mb-12">
    <h1 class="font-['Ma_Shan_Zheng'] text-5xl text-primary mb-4">作家专区</h1>
    <p class="text-lg text-red-700">笔墨生花，妙手著文</p>
  </div>

  <div class="flex justify-end mb-8">
    <button
      on:click={() => toggleNovelForm()}
      class="bg-[#FEF9D5] hover:bg-red-700 text-white font-medium py-2 px-6 rounded-full shadow-sm transition duration-200"
    >
      创作新作品
    </button>
  </div>

  {#if error}
    <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
      <p class="text-sm text-primary">{error}</p>
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
                  <div class="flex flex-wrap gap-2">
                    {#each novel.categories || [] as category}
                      <span class="bg-red-100 text-primary px-2 py-1 rounded-full">
                        {category.name}
                      </span>
                    {/each}
                  </div>
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {novel.status === 'ongoing' ? '连载中' : '已完结'}
                  </span>
                  <span>章节：{novel.chapters?.length || 0}</span>
                </div>
                <p class="text-gray-700">{novel.description}</p>
                <div class="mt-4">
                  <button
                    on:click={() => startAddChapter(novel)}
                    class="px-4 py-2 rounded-full text-sm"
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
              <div class="grid grid-cols-3 gap-4">
                {#each novel.chapters as chapter}
                  <div class="group p-3 rounded-lg border-2 border-red-100 hover:border-red-300 hover:bg-red-50 transition-all duration-200">
                    <div class="flex justify-between items-center">
                      <a
                        href={`/novel/${novel.id}/chapter/${chapter.id}`}
                        class="text-gray-900 group-hover:text-primary transition-colors duration-200"
                      >
                        <h5>{chapter.title}</h5>
                      </a>
                      <button
                        on:click={() => {
                          selectedNovel = novel;
                          newChapter = {
                            title: chapter.title,
                            content: chapter.content || '',
                            is_free: chapter.is_free,
                            id: chapter.id,
                            novel_id: selectedNovel.id
                          };
                          showChapterForm = true;
                          initialChapterEditor();
                        }}
                        class="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200"
                      >
                        编辑
                      </button>
                    </div>
                  </div>
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
  <NovelForm categories={categories} newNovel={newNovel} fetchNovels={fetchNovels} toggleNovelForm={toggleNovelForm} />
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
            <label for="chapter-is_free" class="block text-sm font-medium text-gray-700">章节免费</label>
            <input
              type="checkbox"
              id="chapter-is_free"
              bind:checked={newChapter.is_free}
              class=""
            />
          </div>
          <div class="">
            <label for="content" class="block text-sm font-medium text-gray-700">章节内容</label>
            <div class="h-96">
            <div
              id="chapterEditor"
              contenteditable
              on:paste={(e)=>newChapter.content = e.clipboardData?.getData('text/html')}
              bind:innerHTML={newChapter.content}
              class="w-full mt-1 block rounded-md border-2 border-red-200"
              placeholder="请输入章节内容"
            ></div>
            </div>
          </div>
        </div>
        <div class="mt-15 flex justify-end gap-3">
          <button
            type="button"
            on:click={() => showChapterForm = false}
            class="px-4 py-2 border-2 border-red-200 rounded-md"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-[#FEF9D5] text-white rounded-md hover:bg-red-700"
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