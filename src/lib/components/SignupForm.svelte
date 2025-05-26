<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import Btn from './common/Btn.svelte';
  import { getUserIp } from '$lib/helpers';
  import ErrorMessage from './common/ErrorMessage.svelte';
  
  export let role = '';
  
  let email = '';
  let password = '';
  let username = '';
  let loading = false;
  let error: null = null;
  
  // 新增字段
  let publishedWebsite = '';
  let publishedPenName = '';
  let publishedWorkTitle = '';
  let plannedWorkDescription = '';
  let workDraftFile: File | null = null;
  
  async function handleSignup() {
    try {
      loading = true;
      error = null;
      
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) throw signupError;
      const userId = data?.user?.id;

      if (userId) {
        try {
          // 获取用户IP地址
          const userIp = await getUserIp();

          const userProfileData = {
            user_name: username,
            email,
            role,
            user_id: userId,
            ip: userIp,
            published_website: publishedWebsite,
            published_pen_name: publishedPenName,
            published_work_title: publishedWorkTitle,
            planned_work_description: plannedWorkDescription
          };

          const {data:userProfile, error:userProfileError} = await supabase
          .from('user_profiles')
          .insert(userProfileData);

          // 如果有上传文件，保存到存储
          if (workDraftFile) {
            const filePath = `user_uploads/${userId}/draft_${Date.now()}.${workDraftFile.name.split('.').pop()}`;
            const { error: uploadError } = await supabase
              .storage
              .from('user-documents')
              .upload(filePath, workDraftFile);

            if (!uploadError) {
              await supabase
                .from('user_profiles')
                .update({ draft_file_path: filePath })
                .eq('user_id', userId);
            }
          }

          if (userProfileError) throw userProfileError;
        } catch (ipError) {
          console.error("获取IP地址失败:", ipError.message);
          // 即使获取IP失败，也继续创建用户资料
          const {data:userProfile, error:userProfileError} = await supabase
          .from('user_profiles')
          .insert({
            user_name: username,
            email,
            role,
            user_id: userId
          });

          if (userProfileError) throw userProfileError;
        }
      }

      // Redirect to email confirmation page if signup is successful
      if (userId) {
        goto('/email-confirmation');
      }
    } catch (e: any) {
      error = e;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen  flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h2 class=" text-4xl text-primary mb-2">
        {WEBSITE_NAME}
      </h2>
      <p class="text-lg text-red-700">
        {role === 'author' ? '作家注册' : '读者注册'}
      </p>
    </div>
    
    {#if error}
      <ErrorMessage error={error} />
    {/if}
    
    <form class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-lg border-2 border-gray-400 shadow-xl" on:submit|preventDefault={handleSignup}>
      <div class="space-y-4">
        <div class="prose text-gray-700 mb-4">
          <h3 class="text-lg font-medium">欢迎加入我们</h3>
          <p class="text-sm">
            这里没有KPI，没有各类排行榜，没有全勤，也不需要水字数，更不需要"天下无敌，天上来敌；天上无敌，天外来敌"这种同质化的堆砌，需要的只是对于文字的尊重和喜爱。
          </p>
          <p class="text-sm">
            希望这里能成为一个志趣相投的同仁社区。
          </p>
          <p class="text-sm">
            网站会员对于你作品的有效阅读是你的绩效的唯一衡量指标。
          </p>
        </div>
        <div>
          <label for="user_name" class="block text-sm font-medium text-gray-700">呢称</label>
          <input
            id="user_name"
            name="user_name"
            type="text"
            required
            bind:value={username}
            class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
            placeholder="请输入名字"
          />
        </div>
        <div>
          <label for="email-address" class="block text-sm font-medium text-gray-700">电子邮箱</label>
          <input
            id="email-address"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
            placeholder="请输入邮箱地址"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            bind:value={password}
            minlength="6"
            class="mt-1 block w-full rounded-md border-2 py-2 px-3"
            placeholder="请输入密码（至少6位）"
          />
        </div>

        {#if role === 'author'}
        <!-- 已发表作品字段组 -->
        <div class="space-y-4 border-t pt-4 mt-4">
          <h4 class="text-sm font-medium text-gray-700">已发表的作品（选填）</h4>
          <div class="space-y-2">
            <div>
              <label for="publishedWebsite" class="block text-sm font-medium text-gray-700">网站</label>
              <input
                type="text"
                id="publishedWebsite"
                bind:value={publishedWebsite}
                class="mt-1 block w-full rounded-md border-2 py-2 px-3"
                placeholder="如：起点中文网"
              />
            </div>
            <div>
              <label for="publishedPenName" class="block text-sm font-medium text-gray-700">笔名</label>
              <input
                type="text"
                id="publishedPenName"
                bind:value={publishedPenName}
                class="mt-1 block w-full rounded-md border-2 py-2 px-3"
                placeholder="您在其他平台的笔名"
              />
            </div>
            <div>
              <label for="publishedWorkTitle" class="block text-sm font-medium text-gray-700">作品名称</label>
              <input
                type="text"
                id="publishedWorkTitle"
                bind:value={publishedWorkTitle}
                class="mt-1 block w-full rounded-md border-2 py-2 px-3"
                placeholder="您发表过的作品名称"
              />
            </div>
          </div>
        </div>

        <!-- 计划发表作品简介 -->
        <div class="border-t pt-4">
          <label for="plannedWorkDescription" class="block text-sm font-medium text-gray-700">
            已发表作品
          </label>
          <textarea
            id="plannedWorkDescription"
            bind:value={plannedWorkDescription}
            rows={4}
            class="mt-1 block w-full rounded-md border-2 py-2 px-3"
            placeholder="作品简纲或者前两章存稿（可选）"
          ></textarea>
        </div>

        <!-- 文件上传 -->
        <div>
          <label class="block text-sm font-medium text-gray-700">上传作品文件（可选）</label>
          <input
            type="file"
            on:change={(e) => workDraftFile = e.target.files?.[0] || null}
            class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file: file:text-red-700 hover:file:bg-red-100"
          />
        </div>
        {/if}
      </div>

      <div>
        <Btn title={loading ? '注册中...' : '立即注册'} disabled={loading} type="submit" />
      </div>
      
      <div class="text-sm text-center mt-6 pt-4 border-t border-gray-400">
        <a href="/user/login" class="font-medium text-red-600 hover:text-red-500 transition duration-200">
          已有账户？立即登录
        </a>
      </div>
    </form>
  </div>
</div>