<script lang="ts">
  export let field: string;
  export let label: string;
  export let type: string = 'text';
  export let placeholder: string;
  export let value: string;
  export let required: boolean = false;
  export let minlength: number | undefined;
</script>
<div>
  <label for={field} class="block text-sm font-medium text-gray-700">{label}</label>
  <input
    id={field}
    name={field}
    type={type}
    required
    bind:value={value}
    minlength={minlength}
    class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
    placeholder={placeholder}
  />
</div>