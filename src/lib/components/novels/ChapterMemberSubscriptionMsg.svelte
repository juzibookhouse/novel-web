<script lang="ts">
  export let handleMembershipModal;
</script>
<div class="text-center py-8">
  <p class="text-gray-800 mb-4">订阅会员后即可继续阅读</p>
  <button
    on:click={() => handleMembershipModal()}
    class="px-6 py-2 rounded-full"
  >
    立即订阅
  </button>
</div>
