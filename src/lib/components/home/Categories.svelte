<script lang="ts">
  export let categories;
</script>
<!-- Categories Section -->
<section class="py-24 px-4 bg-white/80">
  <div class="max-w-7xl mx-auto">
    <h2 class="font-['Ma_Shan_Zheng'] text-5xl text-primary text-center mb-16">
      精选分类
    </h2>
    <div class="grid grid-cols-4 gap-8">
      {#each categories as category}
        <a
          href={`/novels?category=${category.name}`}
          class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
          ></div>
          <div class="relative p-8 text-center">
            <!-- <span
              class="text-6xl mb-6 block transform group-hover:scale-110 transition-transform duration-300"
              >{category.icon}</span
            > -->
            <h3 class="text-3xl font-medium text-white mb-2">
              {category.name}
            </h3>
            <!-- <p class="text-white/80">{category.desc}</p> -->
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>
