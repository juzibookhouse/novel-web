<script lang="ts">
  import { goto } from "$app/navigation";
  import MembershipPlans from "$lib/components/MembershipPlans.svelte";
  import { supabase } from "$lib/supabaseClient";
  import { user } from "$lib/stores/authStore";
  import { onMount } from "svelte";
  import { getPlanPrice } from "$lib/membership";
  import Btn from "../common/Btn.svelte";

  let userName = $user?.user_name || '';
  let userEmail = '';
  let authEmail = '';
  let authEmailReady = false;
  let authEmailAccount: string | undefined;
  let authEmailRequest = 0;
  let userPassword = "";
  let membershipPlan: any;
  let loading = false;
  let message = "";
  let messageType: "success" | "error" = "success";
  let showMembershipModal = false;
  let showPasswordModal = false;
  let applyingAuthor = false;

  async function loadAuthEmail(accountId?: string) {
    authEmailAccount = accountId;
    const request = ++authEmailRequest;
    authEmailReady = false;
    authEmail = '';
    userEmail = '';
    if (!accountId) return;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (request !== authEmailRequest) return;
      if (error || data.user?.id !== accountId || !data.user.email) throw new Error('auth_email_unavailable');
      authEmail = data.user.email;
      userEmail = authEmail;
      authEmailReady = true;
    } catch {
      if (request === authEmailRequest) {
        message = '无法确认当前登录邮箱，请刷新后重试';
        messageType = 'error';
      }
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("zh-CN");
  }

  function updateProfile() {
    if (!authEmailReady) return;
    // 重置消息和密码
    message = "";
    userPassword = "";
    // 显示密码验证模态框
    showPasswordModal = true;
  }

  async function verifyAndUpdate() {
    if (loading) return;
    try {
      loading = true;
      if (!$user || !authEmailReady) throw new Error("无法确认登录身份，请刷新后重试");
      const accountId = $user.id;
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || authData.user?.id !== accountId || !authData.user.email) throw new Error('无法确认登录身份，请重新登录');
      if (authData.user.email !== authEmail) throw new Error('登录邮箱已变化，请刷新核对后再修改');

      // 先验证密码
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: authData.user.email,
        password: userPassword
      });

      if (signInError) throw new Error("密码验证失败");
      if (signInData.user?.id !== accountId || $user?.id !== accountId) throw new Error('登录账号已变化，请重新打开个人中心');

      // 更新用户名
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          user_name: userName,
        })
        .eq("user_id", accountId);

      if (profileError) throw profileError;

      // 如果邮箱有变化，更新邮箱
      if (userEmail !== authData.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: userEmail,
        });

        if (emailError) throw emailError;
        message = "个人资料已更新，邮箱验证链接已发送到新邮箱，请查收并验证";
      } else {
        message = "个人资料已更新";
      }
      
      messageType = "success";
      // 关闭密码模态框
      showPasswordModal = false;
      // 清空密码
      userPassword = "";
    } catch (error: any) {
      console.error(error);
      message = `更新失败: ${error.message || "未知错误"}`;
      messageType = "error";
    } finally {
      loading = false;
    }
  }

  async function applyForAuthor() {
    // Review registration intent before submitting through the trusted endpoint.
    if (applyingAuthor) return;
    applyingAuthor = true;
    try { await goto('/author/signup'); }
    finally { applyingAuthor = false; }
  }

  onMount(() => {
    const unsubscribe = user.subscribe((currentUser) => {
      if (currentUser?.id !== authEmailAccount) void loadAuthEmail(currentUser?.id);
    });
    void (async () => { if ($user?.membership?.plan_id) {
      const { data: plan } = await supabase.from('membership_plans').select('*')
        .eq('id', $user.membership.plan_id).single();
      membershipPlan = plan;
    } })();
    return () => { authEmailRequest++; unsubscribe(); };
  });
</script>

{#if showMembershipModal}
  <MembershipPlans onClose={() => (showMembershipModal = false)} />
{/if}

{#if showPasswordModal}
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
      <h3 class="text-lg font-medium text-gray-900 mb-4">安全验证</h3>
      <p class="text-sm text-gray-500 mb-4">请输入您的密码以确认身份</p>
      
      {#if message && showPasswordModal}
        <div class={messageType === "success" 
          ? "bg-green-50 p-4 rounded-md text-green-700 mb-4" 
          : " p-4 rounded-md text-red-700 mb-4"}>
          {message}
        </div>
      {/if}

      <div class="mb-4">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          密码
        </label>
        <input
          type="password"
          id="password"
          bind:value={userPassword}
          class="w-full rounded-md border-2 border-red-200 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500"
          placeholder="请输入您的密码"
        />
      </div>

      <div class="flex justify-end space-x-3">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          on:click={() => {
            showPasswordModal = false;
            userPassword = "";
            message = "";
          }}
        >
          取消
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
          disabled={loading || !userPassword}
          on:click={verifyAndUpdate}
        >
          {loading ? "验证中..." : "确认"}
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="p-6">
  <!-- Membership Card -->
  <div class="mb-8">
    <h2 class="text-xl font-medium text-gray-900 mb-4">会员状态</h2>
    {#if $user?.membership}
      <div
        class="bg-gradient-to-r from-red-800 to-red-600 rounded-lg p-6 text-white"
      >
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-2xl font-semibold">
              {membershipPlan?.name || "会员"}
            </h3>
            <p class="text-red-100">会员编号: {$user.membership?.id}</p>
          </div>
          <div class="text-right">
            <p class="text-xl font-bold">{getPlanPrice({plan:membershipPlan})}</p>
            <p class="text-red-100">
              到期时间: {formatDate($user.membership?.end_date)}
            </p>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <p class="text-red-100">
            状态: {$user.membership?.status === "active" ? "有效" : "待缴费"}
          </p>
          <div class="flex gap-2">
            {#if $user.isMembership}
              <Btn title="查看计划" handleClick={() => (showMembershipModal = true)} />
              <!-- <Btn title="提前续费" handleClick={() => (showMembershipModal = true)} /> -->
            {:else}
              <Btn title="缴费" handleClick={() => (showMembershipModal = true)} />
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="bg-gray-50 rounded-lg p-6 text-center">
        <p class="text-gray-600 mb-4">您还不是会员</p>
        <Btn title="立即开通" handleClick={() => (showMembershipModal = true)} />
      </div>
    {/if}
  </div>

  <!-- Profile Form -->
  <div class="max-w-lg">
    <h2 class="text-xl font-medium text-gray-900 mb-4">基本信息</h2>
    <div class="space-y-4">
      {#if message}
        <div class={messageType === "success" 
          ? "bg-green-50 p-4 rounded-md text-green-700" 
          : " p-4 rounded-md text-red-700"}>
          {message}
        </div>
      {/if}
      {#if ($user?.role === 'author') && ($user?.is_approved)}
        <p class="mt-1 text-green-600">已是认证作家</p>
      {/if}
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700"
          >邮件</label
        >
        <input
          type="email"
          id="email"
          bind:value={userEmail}
          disabled={!authEmailReady || loading}
          class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500"
        />
      </div>
      <div>
        <label for="firstName" class="block text-sm font-medium text-gray-700"
          >呢称</label
        >
        <input
          type="text"
          id="firstName"
          bind:value={userName}
          class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500"
        />
      </div>

      <Btn title={loading ? "更新中..." : "更新资料"} disabled={loading || !authEmailReady} handleClick={updateProfile} />

      {#if $user?.role === 'reader'}
        <div>
          <Btn title={applyingAuthor ? '申请中...' : '申请成为作家'} handleClick={applyForAuthor} disabled={applyingAuthor}/>
        </div>
      {:else if $user?.role === 'author' && !$user?.is_approved}
        <p class="mt-1 text-yellow-600">作家申请审核中</p>
      {/if}


    </div>
  </div>
</div>
