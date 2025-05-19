<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import Btn from '$lib/components/common/Btn.svelte';
  
  let loading = false;
  let error: string | null = null;
  let success = false;
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    error = null;
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const data = {
      title: formData.get('title'),
      content: formData.get('content'),
      email: formData.get('email'),
      user_name: formData.get('user_name')
    };
    
    try {
      const response = await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/contact_forms`, {
        method: 'POST',
        headers: {
          'apikey': PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '提交失败，请稍后重试');
      }
      
      success = true;
      form.reset();
    } catch (e) {
      error = e instanceof Error ? e.message : '提交失败，请稍后重试';
      success = false;
    } finally {
      loading = false;
    }
  }
</script>
  
  <svelte:head>
    <title>联系我们 - {WEBSITE_NAME}</title>
  </svelte:head>
  
  <div class="py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="font-['Ma_Shan_Zheng'] text-5xl text-primary mb-4">联系我们</h1>
        <p class="text-lg text-red-700">您的建议是我们进步的动力</p>
      </div>
  
      {#if success}
        <div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center mb-8">
          <h3 class="text-xl font-medium text-green-800 mb-2">提交成功！</h3>
          <p class="text-green-700">感谢您的反馈，我们会尽快回复。</p>
        </div>
      {:else}
        <form
          on:submit={handleSubmit}
          class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-xl p-8"
        >
          {#if error}
            <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-primary">{error}</p>
            </div>
          {/if}
  
          <div class="space-y-6">
            <div>
              <label for="user_name" class="block text-sm font-medium text-gray-700">
                您的姓名
              </label>
              <input
                type="text"
                name="user_name"
                id="user_name"
                required
                class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
                placeholder="请输入您的姓名"
              />
            </div>
            
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
              <Btn 
                title={loading ? '提交中...' : '提交'} 
                type="submit" 
                disabled={loading}
                cssClass={loading ? 'opacity-70 cursor-not-allowed' : ''}
              />
            </div>
          </div>
        </form>
      {/if}
    </div>
  </div>