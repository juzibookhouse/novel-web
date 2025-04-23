<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import SignupForm from '$lib/components/SignupForm.svelte';
  import MembershipPlans from '$lib/components/MembershipPlans.svelte';
  import { user } from '$lib/stores/authStore';

  let showMembership = false;

  // Show membership modal after successful signup
  $: if ($user) {
    showMembership = true;
  }
</script>

<svelte:head>
  <title>读者注册 - {WEBSITE_NAME}</title>
  <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
</svelte:head>

{#if showMembership}
  <MembershipPlans onClose={() => showMembership = false} />
{/if}

<SignupForm role="reader" />