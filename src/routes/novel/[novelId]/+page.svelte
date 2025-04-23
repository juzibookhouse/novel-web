<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
    export let data;
    const { novel } = data;
  </script>
  
  <svelte:head>
    <title>{novel.title} - {WEBSITE_NAME}</title>
  </svelte:head>
  
  <div class="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-xl overflow-hidden">
        <!-- Novel Header -->
        <div class="p-8 border-b-2 border-red-100">
          <div class="flex flex-col md:flex-row gap-8">
            <div class="w-1/3">
              <img
                src={novel.cover_url || 'https://via.placeholder.com/300x400?text=封面未上传'}
                alt={novel.title}
                class="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div class="w-2/3">
              <h1 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 mb-4">{novel.title}</h1>
              <div class="space-y-4">
                <div class="flex items-center">
                  <span class="text-gray-600">作者：</span>
                  <span class="ml-2 text-gray-900">{novel.author || '佚名'}</span>
                </div>
                <div class="flex items-center">
                  <span class="text-gray-600">类别：</span>
                  <span class="ml-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                    {novel.category || '未分类'}
                  </span>
                </div>
                <div>
                  <span class="text-gray-600">简介：</span>
                  <p class="mt-2 text-gray-800 leading-relaxed">
                    {novel.description || '暂无简介'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Chapter List -->
        <div class="p-8">
          <h2 class="font-['Ma_Shan_Zheng'] text-2xl text-red-800 mb-6">目录</h2>
          <div class="grid grid-cols-2 gap-4">
            {#each novel.chapters as chapter}
              <a
                href={`/novel/${novel.id}/chapter/${chapter.id}`}
                class="group p-4 rounded-lg border-2 border-red-100 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
              >
                <h3 class="text-lg text-gray-900 group-hover:text-red-800 transition-colors duration-200">
                  {chapter.title}
                </h3>
              </a>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <style>
    :global(body) {
      background-color: #FEF2F2;
    }
  </style>