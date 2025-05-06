<script lang="ts">
    import { getContactForms } from "$lib/supabaseClient";
  import { onMount } from "svelte";

  let forms;

  onMount(async()=>{
    const {data, error} = await getContactForms();
    forms = data;
  })
</script>

<div class="p-6">
  <table class="min-w-full divide-y divide-red-100">
    <thead>
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮件</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-red-100">
      {#each forms as form}
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{form.title}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{form.email}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.content}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{form.created_at}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
