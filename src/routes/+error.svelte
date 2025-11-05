<script lang="ts">
  export let error: any;
  export let status: number;

  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>{status === 404 ? '页面未找到 (404)' : '出错了'}</title>
</svelte:head>

<Header />

<main class="min-h-[60vh] flex items-center justify-center p-6 bg-gray-50">
  <div class="max-w-2xl w-full text-center">
    {#if status === 404}
      <h1 class="text-6xl font-bold text-gray-800">404</h1>
      <p class="mt-4 text-xl text-gray-600">抱歉，找不到你请求的页面。</p>
      <p class="mt-2 text-sm text-gray-500">可能链接已失效或页面已被移除。</p>
      <div class="mt-6">
        <a href="/" class="inline-block bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700">返回首页</a>
      </div>
    {:else}
      <h1 class="text-4xl font-semibold text-gray-800">出错了</h1>
      <p class="mt-4 text-gray-600">服务器返回了 {status} 错误。</p>
      {#if error?.message}
        <pre class="mt-4 p-4 bg-white border rounded text-left text-sm text-rose-600">{error.message}</pre>
      {/if}
      <div class="mt-6">
        <a href="/" class="inline-block bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700">返回首页</a>
      </div>
    {/if}
  </div>
</main>
