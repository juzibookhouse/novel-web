<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import Btn from './common/Btn.svelte';
  import InputField from './common/InputField.svelte';
  import { onMount } from 'svelte';
  import { sendRequest } from '$lib/api';
  import ErrorMessage from './common/ErrorMessage.svelte';
  import { adminEmail } from '$lib/api/adminEmail';
  
  export let isLoggedIn = false;
  
  let email = '';
  let password = '';
  let username = '';
  let loading = false;
  let error: Error | null = null;
  
  // 作者特有字段
  let publishedWebsite = '';
  let publishedPenName = '';
  let publishedWorkTitle = '';
  let plannedWorkDescription = '';
  let workDraftFile: File | null = null;
  let intentReady = false;
  let mounted = false;
  let intentRequested = false;
  let intentGeneration = 0;
  
  // Metadata is form input only, never authority. Keep it until submission succeeds.
  onMount(() => {
    mounted = true;
    return () => { mounted = false; intentGeneration++; };
  });

  // A parent can discover the session after this component has mounted.
  $: syncLoginState(mounted, isLoggedIn);

  function syncLoginState(isMounted: boolean, loggedIn: boolean) {
    if (!isMounted) return;
    if (!loggedIn) {
      intentReady = false;
      intentRequested = false;
      intentGeneration++;
      return;
    }
    return restoreIntent();
  }

  async function restoreIntent() {
    if (intentRequested) return;
    intentRequested = true;
    const generation = ++intentGeneration;
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (!mounted || !isLoggedIn || generation !== intentGeneration) return;
      if (authError) throw authError;
      const intent = data.user?.user_metadata?.author_application_intent;
      if (!data.user) throw new Error('not_signed_in');
      email = data.user.email || '';
      username = typeof data.user.user_metadata?.user_name === 'string' ? data.user.user_metadata.user_name : '';
      if (intent?.requested === true) {
        if (!publishedWebsite && typeof intent.published_website === 'string') publishedWebsite = intent.published_website;
        if (!publishedPenName && typeof intent.published_pen_name === 'string') publishedPenName = intent.published_pen_name;
        if (!publishedWorkTitle && typeof intent.published_work_title === 'string') publishedWorkTitle = intent.published_work_title;
        if (!plannedWorkDescription && typeof intent.planned_work_description === 'string') plannedWorkDescription = intent.planned_work_description;
      }
      intentReady = true;
    } catch {
      if (mounted && isLoggedIn && generation === intentGeneration) {
        error = new Error('无法恢复注册时的申请信息，请刷新后重试；信息尚未提交');
      }
    }
  }

  async function handleSignup() {
    if (loading) return;
    try {
      loading = true;
      error = null;
      if (isLoggedIn && !intentReady) throw new Error('申请信息尚未恢复，请刷新后重试');
      
      let userId;
      
      if (!isLoggedIn) {
        // 新用户注册流程
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          // Untrusted pending intent only; never a role or approval assignment.
          options: { data: {
            user_name: username,
            author_application_intent: {
              requested: true,
              published_website: publishedWebsite,
              published_pen_name: publishedPenName,
              published_work_title: publishedWorkTitle,
              planned_work_description: plannedWorkDescription
            }
          } },
        });

        if (signupError) throw signupError;
        userId = data?.user?.id;
        // Auth's database transaction initializes the reader profile without a Session.
        // Do not anonymously insert profiles or upload attachments.
        if (userId) {
          try { await adminEmail.newUser(username, email, 'reader'); }
          catch { console.error('注册通知发送失败'); }
          goto('/email-confirmation');
        }
        return;
      }
      const application: Record<string, string> = {
        published_website: publishedWebsite, published_pen_name: publishedPenName,
        published_work_title: publishedWorkTitle, planned_work_description: plannedWorkDescription
      };
      if (workDraftFile) {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) throw new Error('请重新登录后提交');
        const extension = workDraftFile.name.split('.').pop() || '';
        if (!/^[a-zA-Z0-9]+$/.test(extension)) throw new Error('文件扩展名无效');
        const filePath = `user_uploads/${data.user.id}/draft_${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('user-documents').upload(filePath, workDraftFile);
        if (uploadError) throw new Error('附件上传失败，申请尚未提交');
        const { data: publicUrlData } = supabase.storage.from('user-documents').getPublicUrl(filePath);
        if (!publicUrlData?.publicUrl) throw new Error('无法取得附件地址，申请尚未提交');
        application.draft_file_path = publicUrlData.publicUrl;
      }
      const result = await sendRequest('/api/author-application', { method: 'POST', body: JSON.stringify(application) });
      if (result.error) {
        if (result.status === 401) throw new Error('登录已失效，请重新登录后提交');
        if (result.status === 409) throw new Error('资料不存在、已申请或账号不符合申请条件；未覆盖现有资料，请刷新核对');
        throw new Error('申请未能确认成功，请保留当前内容并稍后核对；不要重复提交');
      }
      if (result.data?.success !== true) throw new Error('申请结果异常，请保留当前内容并核对');
      // Existing best-effort notice; its failure must not repeat the accepted application.
      try { await adminEmail.newAuthor(username, email); }
      catch { console.error('作者申请通知发送失败'); }
      goto('/author/pending');
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
    
    <form class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded border-2 border-gray-400 shadow" on:submit|preventDefault={handleSignup}>
      <div class="space-y-4">
        <div class="prose text-gray-700 mb-4">
          <h3 class="text-lg font-medium">欢迎加入我们</h3>
          {#if !isLoggedIn}
            <p class="text-sm">本步骤创建普通读者账号并记录作者申请意图，不授予作者权限；请先验证邮箱，后续再完成作者申请。</p>
          {/if}
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
        {#if !isLoggedIn}<p class="text-sm">新账号此时不上传附件；请保留本地文件，邮箱验证并登录后再上传。</p>{/if}
        <div>
          <label class="block text-sm font-medium text-gray-700">上传作品文件（可选）</label>
          <input
            type="file"
            disabled={!isLoggedIn}
            on:change={(e) => workDraftFile = (e.currentTarget as HTMLInputElement).files?.[0] || null}
            class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file: file:text-red-700 hover:file:bg-red-100"
          />
        </div>
      </div>

      <div>
        <Btn 
          title={loading 
            ? (isLoggedIn ? '提交中...' : '注册中...') 
            : (isLoggedIn ? '提交申请' : '立即注册')
          } 
          disabled={loading || (isLoggedIn && !intentReady)} 
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
