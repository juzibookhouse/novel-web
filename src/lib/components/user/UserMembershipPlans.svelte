<script>
    import { getPlanPrice } from "$lib/membership";

  export let plans;
  export let selectPlan;
</script>
{#each plans as plan}
  <button
    class="relative border-2 border-gray-300 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white"
    on:click={() => selectPlan(plan)}
  >
    <!-- Promotion Badge -->
    <!-- <div class="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
      限时优惠
    </div> -->
    
    <h3 class="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
    
    <!-- Price Display -->
    <div class="mb-4">
      <div class="text-4xl font-bold text-primary mb-1">
        {getPlanPrice({plan})}
      </div>
      {#if plan.old_price}
      <div class="text-lg font-semibold text-gray-500 line-through">
        {getPlanPrice({plan, isOldPrice:true})}
      </div>
      {/if}
    </div>
    
    <p class="text-gray-700 mb-4 leading-relaxed">{plan.description}</p>
    
    <!-- Promotion Info -->
    {#if plan.old_price}
    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div class="flex items-center text-sm text-yellow-800">
        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
        </svg>
        <span class="font-medium">优惠截止日期：2026年01月04日</span>
      </div>
    </div>
    {/if}
    
    <!-- Call to Action -->
    <div class="mt-4 text-center">
      <span class="inline-block bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors">
        立即订阅
      </span>
    </div>
  </button>
{/each}
