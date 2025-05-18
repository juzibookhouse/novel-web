<script lang="ts">
  import Btn from "../common/Btn.svelte";

  export let handleCancel,confirmText,cssClass="mt-6";
</script>
<div class="{cssClass} flex justify-end gap-3">
  <Btn
    type="button"
    handleClick={() => handleCancel()}
    cssClass="border-2"
    title="取消"
  />
  <Btn
    type="submit"
    cssClass="bg-(--primary-color) text-white"
    title={confirmText}
  />
</div>
