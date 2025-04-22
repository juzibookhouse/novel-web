
<script lang="ts">
    import { supabase } from '$lib/supabaseClient';
    import { user } from '$lib/stores/authStore';
    import { onMount } from 'svelte';

    let activeTab = 'profile';
    let firstName = '';
    let lastName = '';
    let loading = false;
    let message = '';
    let shelfNovels: any[] = [];
    let readNovels: any[] = [];

    onMount(async () => {
        if ($user) {
            // Fetch user profile
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('first_name, last_name')
                .eq('user_id', $user.id)
                .single();
            
            if (profile) {
                firstName = profile.first_name || '';
                lastName = profile.last_name || '';
            }

            // Fetch bookshelf novels
            const { data: shelf } = await supabase
                .from('bookshelves')
                .select(`
                    *,
                    novels (
                        id,
                        title,
                        cover_url
                    )
                `)
                .eq('user_id', $user.id);
            
            if (shelf) {
                shelfNovels = shelf.map(item => item.novels);
            }

            // Fetch read novels
            const { data: read } = await supabase
                .from('bookshelves')
                .select(`
                    *,
                    novels (
                        id,
                        title,
                        cover_url
                    )
                `)
                .eq('user_id', $user.id);
            
            if (read) {
                readNovels = read.map(item => item.novels);
            }
        }
    });

    async function updateProfile() {
        try {
            loading = true;
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName
                })
                .eq('user_id', $user?.id);

            if (error) throw error;
            message = '个人资料已更新';
        } catch (error) {
            message = '更新失败，请重试';
        } finally {
            loading = false;
        }
    }
</script>

<div class="container mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8">
                <button
                    class={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'profile'
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    on:click={() => (activeTab = 'profile')}
                >
                    个人资料
                </button>
                <button
                    class={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'shelf'
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    on:click={() => (activeTab = 'shelf')}
                >
                    书架
                </button>
                <button
                    class={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'read'
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    on:click={() => (activeTab = 'read')}
                >
                    已读
                </button>
            </nav>
        </div>

        {#if activeTab === 'profile'}
            <div class="max-w-lg">
                <div class="space-y-4">
                    {#if message}
                        <div class="bg-green-50 p-4 rounded-md text-green-700">
                            {message}
                        </div>
                    {/if}
                    <div>
                        <label for="firstName" class="block text-sm font-medium text-gray-700">名</label>
                        <input
                            type="text"
                            id="firstName"
                            bind:value={firstName}
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        />
                    </div>
                    <div>
                        <label for="lastName" class="block text-sm font-medium text-gray-700">姓</label>
                        <input
                            type="text"
                            id="lastName"
                            bind:value={lastName}
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                        />
                    </div>
                    <button
                        on:click={updateProfile}
                        disabled={loading}
                        class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-300"
                    >
                        {loading ? '更新中...' : '更新资料'}
                    </button>
                </div>
            </div>
        {:else if activeTab === 'shelf'}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {#each shelfNovels as novel}
                    <a href="/novel/{novel.id}" class="block">
                        <div class="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <img
                                src={novel.cover_url || 'https://via.placeholder.com/150'}
                                alt={novel.title}
                                class="w-full h-48 object-cover rounded-md mb-2"
                            />
                            <h3 class="text-gray-900 font-medium">{novel.title}</h3>
                        </div>
                    </a>
                {/each}
            </div>
        {:else if activeTab === 'read'}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {#each readNovels as novel}
                    <a href="/novel/{novel.id}" class="block">
                        <div class="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <img
                                src={novel.cover_url || 'https://via.placeholder.com/150'}
                                alt={novel.title}
                                class="w-full h-48 object-cover rounded-md mb-2"
                            />
                            <h3 class="text-gray-900 font-medium">{novel.title}</h3>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
