<script lang="ts">
  export let field,title,object,rows=1,required=false;
</script>
<div>
  <label for={field} class="block text-sm font-medium text-gray-700"
    >{title}</label
  >
  <textarea
    id={field}
    bind:value={object[field]}
    rows={rows}
    required={required}
    class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
  ></textarea>
</div>