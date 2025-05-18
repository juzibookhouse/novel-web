<script lang="ts">
  import Btn from '$lib/components/common/Btn.svelte';
  
  export let error: string;
  export let onRetry: () => void;
</script>

<div class="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
  <p class="text-sm text-primary">{error}</p>
  <Btn 
    handleClick={onRetry}
    title="重试"
    cssClass="mt-2 text-sm text-primary underline"
  />
</div>