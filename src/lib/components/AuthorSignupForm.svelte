<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import Btn from './common/Btn.svelte';
  import InputField from './common/InputField.svelte';
  import { getUserIp } from '$lib/helpers';
  import ErrorMessage from './common/ErrorMessage.svelte';
  
  export let isLoggedIn = false;
  
  let email = '';
  let password = '';
  let username = '';
  let loading = false;
  let error: null = null;
  
  // 作者特有字段
  let publishedWebsite = '';
  let publishedPenName = '';
  let publishedWorkTitle = '';
  let plannedWorkDescription = '';
  let workDraftFile: File | null = null;
  
  async function handleSignup() {
    try {
      loading = true;
      error = null;
      
      let userId;
      
      if (!isLoggedIn) {
        // 新用户注册流程
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupError) throw signupError;
        userId = data?.user?.id;
      } else {
        // 已登录用户，获取当前用户ID
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
        console.log(userId);

        if (!userId) {
          throw new Error('无法获取当前用户信息');
        }
      }

      if (userId) {
        try {
          // 获取用户IP地址
          const userIp = await getUserIp();
          
          if (isLoggedIn) {
            // 已登录用户，更新用户资料
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({
                role: 'author',
                published_website: publishedWebsite,
                published_pen_name: publishedPenName,
                published_work_title: publishedWorkTitle,
                planned_work_description: plannedWorkDescription
              })
              .eq('user_id', userId);
              
            if (updateError) throw updateError;
          } else {
            // 新用户，创建用户资料
            const userProfileData = {
              user_name: username,
              email,
              role: 'author',
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
            
            if (userProfileError) throw userProfileError;
          }

          // 如果有上传文件，保存到存储
          if (workDraftFile) {
            const filePath = `user_uploads/${userId}/draft_${Date.now()}.${workDraftFile.name.split('.').pop()}`;
            const { error: uploadError } = await supabase
              .storage
              .from('user-documents')
              .upload(filePath, workDraftFile);

            if (!uploadError) {
              // 获取文件的公共URL
              const { data: publicUrlData } = supabase
                .storage
                .from('user-documents')
                .getPublicUrl(filePath);
              
              // 保存完整的文件URL到draft_file_path
              const fileUrl = publicUrlData?.publicUrl || '';
              
              await supabase
                .from('user_profiles')
                .update({ draft_file_path: fileUrl })
                .eq('user_id', userId);
            }
          }

        } catch (ipError) {
          console.error("获取IP地址失败:", ipError.message);
          // 即使获取IP失败，也继续创建用户资料
          const {data:userProfile, error:userProfileError} = await supabase
          .from('user_profiles')
          .insert({
            user_name: username,
            email,
            role: 'author',
            user_id: userId
          });

          if (userProfileError) throw userProfileError;
        }
      }

      // 根据用户是否已登录决定重定向到哪个页面
      if (userId) {
        if (isLoggedIn) {
          // 已登录用户申请成为作家成功，重定向到申请等待页面
          goto('/author/pending');
        } else {
          // 新用户注册并申请成为作家成功，重定向到邮箱确认页面
          // 注册后需要先确认邮箱，所以仍然重定向到邮箱确认页面
          goto('/email-confirmation');
        }
      }
    } catch (e: any) {
      error = e;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h2 class="text-4xl text-primary mb-2">
        {WEBSITE_NAME}
      </h2>
      <p class="text-lg text-red-700">
        {isLoggedIn ? '成为作家' : '作家注册'}
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

        {#if !isLoggedIn}
          <InputField field="user_name" label="呢称" type="text" placeholder="请输入名字" bind:value={username} required />
          <InputField field="email" label="电子邮箱" type="email" placeholder="请输入邮箱地址" bind:value={email} required />
          <InputField field="password" label="密码" type="password" placeholder="请输入密码（至少6位）" bind:value={password} required minlength={6} />
        {/if}
        
        <!-- 已发表作品字段组 -->
        <div class="space-y-4 border-t pt-4 mt-4">
          <h4 class="text-sm font-medium text-gray-700">已发表的作品（选填）</h4>
          <div class="space-y-2">
            <InputField field="publishedWebsite" label="网站" type="text" placeholder="如：起点中文网" bind:value={publishedWebsite} />
            <InputField field="publishedPenName" label="笔名" type="text" placeholder="您在其他平台的笔名" bind:value={publishedPenName} />
            <InputField field="publishedWorkTitle" label="作品名称" type="text" placeholder="您发表过的作品名称" bind:value={publishedWorkTitle} />
          </div>
        </div>

        <!-- 计划发表作品简介 -->
        <div class="border-t pt-4">
          <InputField field="plannedWorkDescription" label="计划在本网站发表作品简介" bind:value={plannedWorkDescription} type="textarea" placeholder="作品简纲或者前两章存稿（可选）"/>
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
      </div>

      <div>
        <Btn 
          title={loading 
            ? (isLoggedIn ? '更新中...' : '注册中...') 
            : (isLoggedIn ? '更新资料' : '立即注册')
          } 
          disabled={loading} 
          type="submit" 
        />
      </div>
      
      {#if !isLoggedIn}
        <div class="text-sm text-center mt-6 pt-4 border-t border-gray-400">
          <a href="/user/login" class="font-medium text-red-600 hover:text-red-500 transition duration-200">
            已有账户？立即登录
          </a>
        </div>
      {/if}
    </form>
  </div>
</div>