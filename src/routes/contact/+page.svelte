<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData } from './$types';
    
    export let form: ActionData;
    
    let submitted = false;
  </script>
  
  <svelte:head>
    <title>联系我们 - 墨香书院</title>
  </svelte:head>
  
  <div class="py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="font-['Ma_Shan_Zheng'] text-5xl text-red-800 mb-4">联系我们</h1>
        <p class="text-lg text-red-700">您的建议是我们进步的动力</p>
      </div>
  
      {#if form?.success}
        <div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center mb-8">
          <h3 class="text-xl font-medium text-green-800 mb-2">提交成功！</h3>
          <p class="text-green-700">感谢您的反馈，我们会尽快回复。</p>
        </div>
      {:else}
        <form
          method="POST"
          use:enhance
          class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-xl p-8"
        >
          {#if form?.error}
            <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-red-800">{form.error}</p>
            </div>
          {/if}
  
          <div class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                电子邮箱
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
                placeholder="请输入您的邮箱地址"
              />
            </div>
  
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700">
                主题
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
                placeholder="请输入主题"
              />
            </div>
  
            <div>
              <label for="content" class="block text-sm font-medium text-gray-700">
                内容
              </label>
              <textarea
                name="content"
                id="content"
                rows="6"
                required
                class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
                placeholder="请详细描述您的问题或建议"
              ></textarea>
            </div>
  
            <div>
              <button
                type="submit"
                class="w-full bg-red-800 text-white py-3 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200"
              >
                提交
              </button>
            </div>
          </div>
        </form>
      {/if}
    </div>
  </div>