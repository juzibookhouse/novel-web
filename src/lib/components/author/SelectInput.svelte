<script lang="ts">
  export let object, title, field, options;
</script>
<div>
  <label for={field} class="block text-sm font-medium text-gray-700">{title}</label>
  <select
    id={field}
    bind:value={object[field]}
    class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
  >
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</div>
