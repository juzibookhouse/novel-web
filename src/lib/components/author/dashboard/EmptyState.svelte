<script lang="ts">
  import Btn from '$lib/components/common/Btn.svelte';
  
  export let message: string;
  export let actionText: string;
  export let action: () => void;
</script>

<div class="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-400">
  <h3 class="text-xl font-medium text-gray-900 mb-2">暂无作品</h3>
  <p class="text-gray-600">{message}</p>
  <Btn 
    handleClick={action}
    title={actionText}
    cssClass="mt-4 font-medium py-2 px-6 rounded-full shadow-sm transition duration-200"
  />
</div>