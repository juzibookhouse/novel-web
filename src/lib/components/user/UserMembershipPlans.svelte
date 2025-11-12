<script>
    import { getPlanPrice } from "$lib/membership";

  export let plans;
  export let selectPlan;
</script>
{#each plans as plan}
  <button
    class="border-2 border-gray-400 rounded-lg p-6 hover:border-gray300 transition-colors cursor-pointer"
    on:click={() => selectPlan(plan)}
  >
    <h3 class="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
    <div class="text-3xl font-bold text-primary mb-4">
      {getPlanPrice({plan})}
    </div>
    <div class="text-3xl font-bold text-primary mb-4 line-through">
      {getPlanPrice({plan, isOldPrice:true})}
    </div>
    <p class="text-gray-600 mb-4">{plan.description}</p>
    <span class="text-gray-500 text-sm">优惠截止日期：2025年11月30日。</span>
  </button>
{/each}
