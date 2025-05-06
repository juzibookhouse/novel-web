<script lang="ts">
  import MembershipPlans from "$lib/components/MembershipPlans.svelte";
  import { supabase } from "$lib/supabaseClient";
  import { user, setUser } from "$lib/stores/authStore";
  import { onMount } from "svelte";
  import { getPlanPrice } from "$lib/membership";

  let userName = "";
  let membershipPlan: any;
  let loading = false;
  let message = "";
  let showMembershipModal = false;
  let applyingAuthor = false;

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("zh-CN");
  }

  async function updateProfile() {
    try {
      loading = true;
      const { error } = await supabase
        .from("user_profiles")
        .update({
          user_name: userName,
        })
        .eq("user_id", $user?.id);

      if (error) throw error;
      message = "个人资料已更新";
    } catch (error) {
      message = "更新失败，请重试";
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
            <button
              on:click={() => (showMembershipModal = true)}
              class="px-4 py-2 rounded-full text-sm hover:bg-red-50 transition-colors"
            >
              续费会员
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="bg-gray-50 rounded-lg p-6 text-center">
        <p class="text-gray-600 mb-4">您还不是会员</p>
        <button
          on:click={() => (showMembershipModal = true)}
          class="px-6 py-2 rounded-full transition-colors"
        >
          立即开通
        </button>
      </div>
    {/if}
  </div>

  <!-- Profile Form -->
  <div class="max-w-lg">
    <h2 class="text-xl font-medium text-gray-900 mb-4">基本信息</h2>
    <div class="space-y-4">
      {#if message}
        <div class="bg-green-50 p-4 rounded-md text-green-700">
          {message}
        </div>
      {/if}
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700"
          >邮件</label
        >
        <p
          id="email"
          class="mt-1 block w-full py-2 text-gray-900"
        >{$user?.email}</p>
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
          <button
            on:click={applyForAuthor}
            disabled={applyingAuthor}
            class="mt-1 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
          >
            {applyingAuthor ? '申请中...' : '申请成为作家'}
          </button>
        {/if}
      </div>
      {:else}
      <div>你是管理员</div>
      {/if}
      
      <button
        on:click={updateProfile}
        disabled={loading}
        class="px-6 py-2 rounded-full transition-colors"
      >
        {loading ? "更新中..." : "更新资料"}
      </button>
    </div>
  </div>
</div>