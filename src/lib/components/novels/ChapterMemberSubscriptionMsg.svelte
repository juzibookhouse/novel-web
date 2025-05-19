<script lang="ts">
  import Btn from "../common/Btn.svelte";

  export let handleMembershipModal;
</script>
<div class="text-center py-8">
  <p class="text-gray-800 mb-4">订阅会员后即可继续阅读</p>
  <Btn
    handleClick={handleMembershipModal}
    title="订阅会员"
  />
</div>
