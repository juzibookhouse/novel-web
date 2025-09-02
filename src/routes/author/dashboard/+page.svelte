<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuthorNovels, getCategories, getTags, supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/authStore';
  import { COVER_PLACEHOLDER, WEBSITE_NAME } from '$lib/constants';
  import Quill from 'quill';
  import { type Category, type Tag, type NewNovel, type Novel, type Chapter, getSortedChapters } from '$lib/novel';
  import NovelForm from '$lib/components/author/NovelForm.svelte';
  import NovelChapterForm from '$lib/components/author/NovelChapterForm.svelte';
  import DashboardHeader from '$lib/components/author/dashboard/DashboardHeader.svelte';
  import NovelCard from '$lib/components/author/dashboard/NovelCard.svelte';
  import ChapterList from '$lib/components/author/dashboard/ChapterList.svelte';
  import EmptyState from '$lib/components/author/dashboard/EmptyState.svelte';
  import LoadingIndicator from '$lib/components/author/dashboard/LoadingIndicator.svelte';
  import ErrorDisplay from '$lib/components/author/dashboard/ErrorDisplay.svelte';
    import { sendRequest } from '$lib/api';
  
  const EMPTY_NOVEL:NewNovel = {
    title: '',
    description: '',
    category_id:'',
    tags:[],
    status: 'ongoing',
    is_free: '',
    published: true
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
    is_free: '',
    published: true,
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
      const {data:{novels: novelsData, error: fetchError}} = await sendRequest('/api/novels');
      if (fetchError) {
        console.error('Error fetching novels:', fetchError);
        return;
      }
      novels = novelsData;
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

<div class="min-h-screen  py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
<div class="max-w-7xl mx-auto">
  <DashboardHeader websiteName={WEBSITE_NAME} />

  {#if ($user?.profile?.role === 'author') && ($user?.profile.is_approved === false)}
  <h2 class="text-3xl text-center my-10">等待管理员通过作者审核</h2>
  {:else}
  <div class="flex justify-end mb-8">
    <button
      on:click={() => toggleNovelForm()}
      class="font-medium py-2 px-6 rounded-full shadow-sm bg-yellow-100 text-yellow-800 transition duration-200 cursor-pointer"
    >
      创作新作品
    </button>
  </div>

  {#if error}
    <ErrorDisplay error={error} onRetry={fetchNovels} />
  {/if}

  {#if loading}
    <LoadingIndicator />
  {:else if novels.length === 0}
    <EmptyState 
      message="暂无作品" 
      actionText="创建新小说" 
      action={toggleNovelForm} 
    />
  {:else}
    <div class="grid grid-cols-1 gap-6">
      {#each novels as novel}
        <NovelCard 
          novel={novel} 
          isSelected={selectedNovel?.id === novel.id}
          onEdit={() => startEditNovel(novel)}
          onAddChapter={() => startAddChapter(novel)}
          {fetchNovels}
        />
          {#if novel.chapters && novel.chapters.length > 0}
            <ChapterList 
              chapters={novel.chapters} 
              selectedNovelId={novel.id}
              onEdit={(chapter) => {
                selectedNovel = novel;
                newChapter = chapter;
                newChapter.novel_id = novel.id;
                toggleNovelChapterForm();
                initialChapterEditor();
              }}
            />
          {/if}
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