<script lang="ts">
  import "../app.css";
  import { onMount } from 'svelte';
  import { initAuth } from '$lib/stores/authStore';
  
  onMount(async () => {
    const authUnsubscribe = await initAuth();
    
    // return () => {
    //   if (authUnsubscribe) authUnsubscribe();
    // };
  });
</script>

<div class="min-h-screen bg-gray-50">
  <slot />
</div>