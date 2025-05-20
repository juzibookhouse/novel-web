<script lang="ts">
  import MembershipPlans from "$lib/components/MembershipPlans.svelte";
  import { supabase } from "$lib/supabaseClient";
  import { user, setUser } from "$lib/stores/authStore";
  import { onMount } from "svelte";
  import { getPlanPrice } from "$lib/membership";
  import Btn from "../common/Btn.svelte";

  let userName = "";
  let userEmail = "";
  let userPassword = "";
  let membershipPlan: any;
  let loading = false;
  let message = "";
  let messageType: "success" | "error" = "success";
  let showMembershipModal = false;
  let showPasswordModal = false;
  let applyingAuthor = false;

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("zh-CN");
  }

  function updateProfile() {
    // 重置消息和密码
    message = "";
    userPassword = "";
    // 显示密码验证模态框
    showPasswordModal = true;
  }

  async function verifyAndUpdate() {
    try {
      loading = true;
      if (!$user) throw new Error("未登录");

      // 先验证密码
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: $user.email!,
        password: userPassword
      });

      if (signInError) throw new Error("密码验证失败");

      // 更新用户名
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          user_name: userName,
        })
        .eq("user_id", $user.id);

      if (profileError) throw profileError;

      // 如果邮箱有变化，更新邮箱
      if (userEmail !== $user.email) {
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
    try {
      applyingAuthor = true;
      const { error } = await supabase
        .from("user_profiles")
        .update({
          role: "author",
          is_approved: false
        })
        .eq("user_id", $user?.id);

      if (error) throw error;
      
      // Refresh user data
      if ($user) {
        await setUser($user);
      }
      
      message = "作家申请已提交，请等待管理员审核";
    } catch (error) {
      message = "申请失败，请重试";
    } finally {
      applyingAuthor = false;
    }
  }

  onMount(async () => {
    if ($user) {
      // Set email from auth user
      userEmail = $user.email || "";
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_name")
        .eq("user_id", $user.id)
        .single();

      if (profile) {
        userName = profile.user_name || "";
      }

      // Fetch membership plan details if user has active membership
      if ($user.membership?.plan_id) {
        const { data: plan } = await supabase
          .from("membership_plans")
          .select("*")
          .eq("id", $user.membership.plan_id)
          .single();

        membershipPlan = plan;
      }
    }
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
            <p class="text-xl font-bold">{getPlanPrice(membershipPlan)}</p>
            <p class="text-red-100">
              到期时间: {formatDate($user.membership?.end_date)}
            </p>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <p class="text-red-100">
            状态: {$user.membership?.status === "active" ? "有效" : "待续费"}
          </p>
          {#if !$user.isMembership}
            <Btn title="续费会员" handleClick={() => (showMembershipModal = true)} />
          {/if}
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
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700"
          >邮件</label
        >
        <input
          type="email"
          id="email"
          bind:value={userEmail}
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

      <Btn title={loading ? "更新中..." : "更新资料"} disabled={loading} handleClick={updateProfile} />

      {#if $user?.profile?.role !== 'admin'}
      <div>
        <label class="block text-sm font-medium text-gray-700">作家状态</label>
        {#if $user?.profile?.role === 'author'}
          {#if $user?.profile?.is_approved}
            <p class="mt-1 text-green-600">已是认证作家</p>
          {:else}
            <p class="mt-1 text-yellow-600">作家申请审核中</p>
          {/if}
        {:else}
          <p class="mt-1 text-red-600">您还不是作家</p>
          <Btn title={applyingAuthor ? '申请中...' : '申请成为作家'} handleClick={applyForAuthor} disabled={applyingAuthor}/>
        {/if}
      </div>
      {:else}
      <div>你是管理员</div>
      {/if}


    </div>
  </div>
</div>