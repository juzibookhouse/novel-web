<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import SignupForm from '$lib/components/SignupForm.svelte';
</script>

<svelte:head>
  <title>作家注册 - {WEBSITE_NAME}</title>
</svelte:head>

<SignupForm role="author" />