<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import { createClient } from '@supabase/supabase-js';
  import Btn from '$lib/components/common/Btn.svelte';
  import {user} from '$lib/stores/authStore';
  import { adminEmail } from '$lib/api/adminEmail';

  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  
  let loading = false;
  let error: string | null = null;
  let success = false;
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    error = null;
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const fileInput = form.querySelector('#upload_file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    let fileUrl = null;
    
    try {
      // 如果有文件上传，先处理文件上传
      if (file) {
        // 创建唯一的文件名
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `contact_uploads/${fileName}`;
        
        // 上传文件到Supabase存储
        const { data, error: uploadError } = await supabase.storage
          .from('contact-files')
          .upload(filePath, file);
          
        if (uploadError) {
          throw new Error('文件上传失败: ' + uploadError.message);
        }
        
        // 获取文件的公共URL
        const { data: urlData } = supabase.storage
          .from('contact-files')
          .getPublicUrl(filePath);
          
        fileUrl = urlData.publicUrl;
      }
      
      const data = {
        title: formData.get('title'),
        content: formData.get('content'),
        email: formData.get('email'),
        user_name: formData.get('user_name'),
        upload_file: fileUrl // 添加文件URL
      };
      
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
      // 发送管理员通知邮件
      try {
        await adminEmail.newContactForm(formData.get('title'));
      } catch (emailError) {
        console.error("发送管理员通知失败:", emailError);
      }

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
        <h1 class=" text-5xl text-primary mb-4">联系我们</h1>
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
          class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-400 shadow-xl p-8"
        >
          {#if error}
            <div class=" border-2 border-red-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-primary">{error}</p>
            </div>
          {/if}
  
          <div class="space-y-6">
            <div>
              <label for="user_name" class="block text-sm font-medium text-gray-700">
                呢称
              </label>
              <input
                type="text"
                name="user_name"
                id="user_name"
                value={$user?.profile?.user_name}
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
                value={$user?.email}
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
              <label for="upload_file" class="block text-sm font-medium text-gray-700">
                上传附件（可选）
              </label>
              <input
                type="file"
                name="upload_file"
                id="upload_file"
                class="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
              />
              <p class="mt-1 text-xs text-gray-500">支持的文件格式：PDF, DOC, DOCX, JPG, PNG等</p>
            </div>

            <div>
              <Btn 
                title={loading ? '提交中...' : '提交'} 
                type="submit" 
                disabled={loading}
              />
            </div>
          </div>
        </form>
      {/if}
    </div>
  </div>