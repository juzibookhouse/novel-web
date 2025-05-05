<script>
    import { getPlanPrice } from "$lib/membership";

  export let plans;
  export let selectPlan;
</script>
{#each plans as plan}
  <div
    class="border-2 border-red-100 rounded-lg p-6 hover:border-red-300 transition-colors cursor-pointer"
    on:click={() => selectPlan(plan)}
  >
    <h3 class="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
    <div class="text-3xl font-bold text-primary mb-4">
      {getPlanPrice(plan)}
    </div>
    <p class="text-gray-600 mb-4">{plan.description}</p>
    <ul class="space-y-2 mb-6">
      {#each plan.features as feature}
        <li class="flex items-center text-gray-700">
          <span class="text-green-500 mr-2">✓</span>
          {feature}
        </li>
      {/each}
    </ul>
  </div>
{/each}
