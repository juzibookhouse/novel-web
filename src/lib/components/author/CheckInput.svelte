<script lang="ts">
  export let title, field, object;
</script>

<div class="flex items-center">
  <label for="{field}" class="block text-sm font-medium text-gray-700"
    >{title}</label
  >
  <input
    type="checkbox"
    id="{field}"
    bind:checked={object[field]}
    class="form-checkbox h-4 w-4 text-red-600 border-red-300 rounded"
  />
</div>
