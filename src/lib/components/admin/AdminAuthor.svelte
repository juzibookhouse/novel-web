<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { getUserDateFormat } from "$lib/user";
    import { formatDuration } from '$lib/novel';

  let authors:any[] = [];

  onMount(()=> {
    fetchAuthors();
  });

 async function fetchAuthors() {
  try {
    // Load authors from user_profiles
    const { data: authorsData, error: authorsError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          novels (
            id,
            reading_records (
              reading_time
            )
          )
        `)
        .eq('role', 'author');

    if (authorsError) throw authorsError;
    if (authorsData?.length > 0) {
      authors = authorsData.map(({user_name,created_at,is_approved,novels}) => {
        return {
          user_name,
          created_at,
          is_approved,
          novelCount: novels?.length,
          novelReadingTime: novels.reduce((acc, novel)=>{
            console.log(acc);
            if (novel.reading_records.length > 0) {
              return acc + novel.reading_records[0].reading_time;
            } else {
              return acc;
            }
          },0)
        }
      });
    }

  } catch (error) {
    
  }
 }


 async function toggleApproval(userId: string, currentStatus: boolean) {
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ is_approved: !currentStatus })
        .eq('id', userId);

      if (updateError) throw updateError;
      fetchAuthors();
    } catch (e: any) {
        // error = e.message;
    }
  }

  const TITLES = ['作家名','注册时间','状态','作品阅读时间','操作'];

</script>
<div class="p-6">
  <table class="min-w-full divide-y divide-red-100">
    <thead>
      <tr>
        {#each TITLES as title }
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-red-100">
      {#each authors as author}
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >{author.user_name}</td
          >
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {getUserDateFormat(author.created_at)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span
              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                {author.is_approved
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-primary'}"
            >
              {author.is_approved ? "已审核" : "未审核"}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
              {formatDuration(author.novelReadingTime)}
            </span>
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
          >
            <button
              on:click={() => toggleApproval(author.id, author.is_approved)}
              class="text-red-600 hover:text-primary"
            >
              {author.is_approved ? "取消审核" : "通过审核"}
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
