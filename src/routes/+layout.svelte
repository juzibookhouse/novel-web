<script lang="ts">
  import "../app.css";
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/authStore';
  
  onMount(async () => {
    
  });
</script>
{$user?.email} {$user?.id}
<div class="min-h-screen bg-gray-50">
  <slot />
</div>