<script lang="ts">
  export let randomNovel;
</script>
<!-- Featured Novel Section -->
<section class="relative py-24 bg-primary overflow-hidden">
  <div class="max-w-7xl mx-auto px-4">
    <div class="relative z-10 flex items-center gap-12">
      <a class="w-1/3" href="/novel/{randomNovel.id}">
        <img
          src={randomNovel.cover_url || "https://via.placeholder.com/600x800"}
          alt={randomNovel.title}
          class="w-full h-[600px] object-cover rounded-2xl shadow-2xl"
        />
      </a>
      <div class="w-2/3 text-left">
        <h2 class="text-4xl font-bold text-primary mb-6">
          {randomNovel.title}
        </h2>
        <p class="text-xl italic text-gray-800 mb-8">
          "{randomNovel.description}"
        </p>
        <a
          href="/novel/{randomNovel.id}"
          class="inline-block bg-red-800 text-white px-8 py-3 rounded-full hover:bg-red-700 transition duration-300"
        >
          开始阅读
        </a>
      </div>
    </div>
  </div>
</section>
