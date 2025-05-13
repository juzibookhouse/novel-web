<script lang="ts">
  export let handleCancel,confirmText,cssClass="mt-6";
</script>
<div class="{cssClass} flex justify-end gap-3">
  <button
    type="button"
    on:click={() => handleCancel()}
    class="px-4 py-2 border-2 rounded-md"
  >
    取消
  </button>
  <button
    type="submit"
    class="px-4 py-2 bg-[#FEF9D5] text-white rounded-md hover:bg-red-700"
  >
    {confirmText}
  </button>
</div>
