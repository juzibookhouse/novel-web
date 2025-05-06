<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuthorNovels, getCategories, getTags, supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/authStore';
  import { COVER_PLACEHOLDER, WEBSITE_NAME } from '$lib/constants';
  import Quill from 'quill';
  import { type Category, type Tag, type NewNovel, type Novel, type Chapter, getSortedChapters } from '$lib/novel';
    import NovelForm from '$lib/components/author/NovelForm.svelte';
    import NovelChapterForm from '$lib/components/author/NovelChapterForm.svelte';
  
  const EMPTY_NOVEL:NewNovel = {
    title: '',
    description: '',
    category_id:'',
    tags:[],
    status: 'ongoing'
  };
  
  let novels: Novel[] = [];
  let categories: Category[] = [];
  let tags:Tag[] = [];
  let loading: boolean = true;
  let error: string | null = null;
  let uploadProgress: number = 0;
  
  let showNovelForm: boolean = false;
  
  function toggleNovelForm() {
    showNovelForm = !showNovelForm;
    newNovel = EMPTY_NOVEL;
  }
  
  let showChapterForm: boolean = false;
  function toggleNovelChapterForm() {
    if (showChapterForm) {
      newChapter = EMPTY_CHAPTER;
    }
    showChapterForm = !showChapterForm;
  }

  let selectedNovel: Novel | null = null;
  let newNovel = EMPTY_NOVEL;

  const EMPTY_CHAPTER: Chapter = {
    id: '',
    title: '',
    content: '',
    novel_id: '',
    created_at: '',
    is_free: false,
    chapter_order: 0
  };
  let newChapter = EMPTY_CHAPTER;

  let newCategoryName: string = '';
  
  onMount(async () => {
    supabase.auth.onAuthStateChange((event, session) => {
      fetchNovels();
      fetchCategories();
      fetchTags();
    });
  });

  function initialChapterEditor() {
    setTimeout(()=>{
      const quill = new Quill('#chapterEditor', {
        theme: 'snow'
      });
    },10);
  }

  async function fetchTags() {
    const { data, error: fetchError } = await getTags();
    
    if (fetchError) {
      console.error('Error fetching tags:', fetchError);
      return;
    }
    
    tags = data || [];
  }

  async function fetchCategories() {
    const { data, error: fetchError } = await getCategories();
    
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
      const {data, error: fetchError} = await getAuthorNovels($user);
      
      if (fetchError) throw fetchError;
      
      novels = (data || []).map(novel => ({
        ...novel,
        tags: novel.novel_tags?.map(nc => nc.tags),
        chapters: getSortedChapters(novel.chapters)
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
      tags: novel.tags?.map(c => c.id) || [],
      categories: novel.categories?.map(c => c.id) || []
    };
    showNovelForm = true;
  }
  
  
  function startAddChapter(novel: Novel) {
    selectedNovel = novel;
    newChapter = EMPTY_CHAPTER
    newChapter.novel_id = novel.id;
    newChapter.chapter_order = (selectedNovel.chapters?.length || 0) + 1
    toggleNovelChapterForm();
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

  {#if ($user?.profile?.role === 'author') && ($user?.profile.is_approved === false)}
  <h2 class="text-3xl text-center my-10">等待管理员通过作者审核</h2>
  {:else}
  <div class="flex justify-end mb-8">
    <button
      on:click={() => toggleNovelForm()}
      class="font-medium py-2 px-6 rounded-full shadow-sm transition duration-200"
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
                <a href="/novel/{novel.id}">
                  <img
                    src={novel.cover_url || COVER_PLACEHOLDER}
                    alt={novel.title}
                    class="w-full h-full object-cover rounded-lg"
                  />
                </a>
              </div>
              <div class="flex-grow">
                <div class="flex justify-between items-center">
                  <h3 class="text-2xl font-medium text-gray-900 mb-2">{novel.title}</h3>
                  <button
                    on:click={() => startEditNovel(novel)}
                    class="bg-yellow-100 cursor-pointer hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm transition duration-200"
                  >
                    编辑小说
                  </button>
                </div>
                
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
                          newChapter = chapter;
                          newChapter.novel_id = novel.id;
                          toggleNovelChapterForm();
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

  {/if}<!--end of check author approved-->
</div>

<!-- Create Novel Modal -->
{#if showNovelForm}
  <NovelForm fetchTags={fetchTags} categories={categories} tags={tags} newNovel={newNovel} fetchNovels={fetchNovels} toggleNovelForm={toggleNovelForm} />
{/if}

<!-- Create Chapter Modal -->
{#if showChapterForm && selectedNovel}
  <NovelChapterForm toggleNovelChapterForm={toggleNovelChapterForm} fetchNovels={fetchNovels} newChapter={newChapter} selectedNovel={selectedNovel} />
{/if}
</div>