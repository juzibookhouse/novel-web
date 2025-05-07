<script>
  import { WEBSITE_NAME } from "$lib/constants";
    import { user } from "$lib/stores/authStore";
</script>

<!-- Hero Section -->
<section
  class="relative min-h-screen flex items-center justify-center py-32 px-4 bg-[#FEF9D5]"
>
  <div
    class="absolute inset-0 bg-gradient-to-b from-red-900/30 to-transparent"
  ></div>
  <div class="relative max-w-7xl mx-auto text-center">
    <div class="flex flex-col items-center justify-center space-y-8">
      <div class="flex items-center justify-center gap-4">
        <h1 class="font-['Ma_Shan_Zheng'] text-7xl text-white">
          {WEBSITE_NAME}
        </h1>
      </div>
      <p class="text-2xl text-yellow-100 max-w-2xl mx-auto">
        汇聚华夏文学精粹，传承千年文化瑰宝
      </p>
      <div class="flex gap-6 mt-8">
        <a
          href="/novels"
          class="bg-yellow-100 text-primary px-12 py-4 rounded-full text-lg hover:bg-yellow-200 transition duration-300 shadow-lg hover:shadow-xl"
        >
          浏览书库
        </a>
        {#if (!$user)}
        <a
          href="/author/signup"
          class="border-2 border-yellow-100 text-yellow-100 px-12 py-4 rounded-full text-lg hover:bg-red-700/30 transition duration-300"
        >
          成为作家
        </a>
        {/if}
      </div>
    </div>
  </div>
</section>
