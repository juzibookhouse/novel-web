<script>
  import {formatDuration, getNovelStatus} from '$lib/novel';
    import { getUserDateFormat } from '$lib/user';

  export let novels;

  const titles = ['作品名','状态','阅读时间','创建时间','操作'];
</script>
<div class="p-6">
  <table class="min-w-full divide-y divide-red-100">
    <thead>
      <tr>
        {#each titles as title}
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-red-100">
      {#each novels as novel}
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >{novel.title}</td
          >
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >{getNovelStatus(novel)}</td
          >
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >{formatDuration(novel.readingTime)}</td
          >
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {getUserDateFormat(novel.created_at)}
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
          >
            <a
              href={`/novel/${novel.id}`}
              class="text-red-600 hover:text-primary"
            >
              查看详情
            </a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
