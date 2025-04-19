<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { user } from '$lib/stores/authStore';
    
    // TypeScript interfaces
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
      user_id: string;
      created_at: string;
      chapters?: Chapter[];
    }
    
    interface NewNovel {
      title: string;
      description: string;
    }
    
    interface NewChapter {
      title: string;
      content: string;
      novel_id: string | null;
    }
    
    let novels: Novel[] = [];
    let loading: boolean = true;
    let error: string | null = null;
    
    // Form state
    let showNovelForm: boolean = false;
    let showChapterForm: boolean = false;
    let selectedNovel: Novel | null = null;
    let newNovel: NewNovel = {
      title: '',
      description: ''
    };
    let newChapter: NewChapter = {
      title: '',
      content: '',
      novel_id: null
    };
    
    onMount(async () => {
      setTimeout(async()=>{
        await fetchNovels();
      },1);
    });
    
    async function fetchNovels(): Promise<void> {
      try {
        loading = true;
        if (!$user?.id) return;
        const { data, error: fetchError } = await supabase
          .from('novels')
          .select(`
            id,
            title,
            description,
            user_id,
            created_at,
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
        console.error('Error fetching novels:', e);
      } finally {
        loading = false;
      }
    }
    
    async function createNovel(): Promise<void> {
      try {
        if (!$user?.id) {
          throw new Error('User not authenticated');
        }
        
        const { data, error: createError } = await supabase
          .from('novels')
          .insert([
            {
              title: newNovel.title,
              description: newNovel.description,
              user_id: $user.id
            }
          ])
          .select();
        
        if (createError) throw createError;
        
        await fetchNovels();
        showNovelForm = false;
        newNovel = { title: '', description: '' };
      } catch (e: any) {
        error = e.message;
        console.error('Error creating novel:', e);
      }
    }
    
    async function createChapter(): Promise<void> {
      try {
        if (!selectedNovel?.id) {
          throw new Error('No novel selected');
        }
        
        const { data, error: createError } = await supabase
          .from('chapters')
          .insert([
            {
              title: newChapter.title,
              content: newChapter.content,
              novel_id: selectedNovel.id,
              chapter_order: 1
            }
          ])
          .select();
        
        if (createError) throw createError;
        
        await fetchNovels();
        showChapterForm = false;
        newChapter = { title: '', content: '', novel_id: null };
      } catch (e: any) {
        error = e.message;
        console.error('Error creating chapter:', e);
      }
    }
    
    function startAddChapter(novel: Novel): void {
      selectedNovel = novel;
      newChapter.novel_id = novel.id;
      showChapterForm = true;
    }
  </script>
  
  <svelte:head>
    <title>Author Dashboard</title>
  </svelte:head>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Author Dashboard</h1>
      <button
        on:click={() => showNovelForm = true}
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
      >
        Create New Novel
      </button>
    </div>
  
    <!-- Error display -->
    {#if error}
      <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    {/if}
  
    <!-- Loading state -->
    {#if loading}
      <div class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    {/if}
  
    <!-- Novel list -->
    {#if !loading && novels.length === 0}
      <div class="text-center py-12">
        <h3 class="text-lg font-medium text-gray-900">No novels yet</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating your first novel</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each novels as novel}
          <div class="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg font-medium text-gray-900">{novel.title}</h3>
              <p class="mt-1 text-sm text-gray-500">{novel.description}</p>
            </div>
            <div class="px-4 py-4 sm:px-6">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-medium text-gray-900">Chapters ({novel.chapters?.length || 0})</h4>
                <button
                  on:click={() => startAddChapter(novel)}
                  class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium py-1 px-2 rounded-md"
                >
                  Add Chapter
                </button>
              </div>
              {#if novel.chapters && novel.chapters.length > 0}
                <ul class="divide-y divide-gray-200">
                  {#each novel.chapters as chapter}
                    <li class="py-2">
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-gray-900">{chapter.title}</p>
                        <a href={`/author/novels/${novel.id}/chapters/${chapter.id}`} class="text-blue-600 hover:text-blue-800 text-xs">Edit</a>
                      </div>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="text-sm text-gray-500">No chapters yet</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  
    <!-- Create Novel Form Modal -->
    {#if showNovelForm}
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Create New Novel</h3>
          </div>
          <form on:submit|preventDefault={createNovel} class="px-4 py-5 sm:p-6">
            <div class="space-y-4">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  id="title"
                  bind:value={newNovel.title}
                  required
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  bind:value={newNovel.description}
                  rows="3"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>
            </div>
            <div class="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                on:click={() => showNovelForm = false}
                class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  
    <!-- Create Chapter Form Modal -->
    {#if showChapterForm && selectedNovel}
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Add Chapter to "{selectedNovel.title}"</h3>
          </div>
          <form on:submit|preventDefault={createChapter} class="px-4 py-5 sm:p-6">
            <div class="space-y-4">
              <div>
                <label for="chapter-title" class="block text-sm font-medium text-gray-700">Chapter Title</label>
                <input
                  type="text"
                  id="chapter-title"
                  bind:value={newChapter.title}
                  required
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label for="content" class="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  id="content"
                  bind:value={newChapter.content}
                  rows="8"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>
            </div>
            <div class="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                on:click={() => showChapterForm = false}
                class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>