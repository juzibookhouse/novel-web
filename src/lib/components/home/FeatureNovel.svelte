<script lang="ts">
  export let randomNovel;
  const {title, description, id, chapters} = randomNovel
  const chapterTitle = chapters.length ? chapters[0].title : '';
</script>

<!-- Featured Novel Section -->
<section class="relative py-24 bg-primary overflow-hidden">
  <div class="max-w-5xl mx-auto px-4 text-center">
    <span class="text-9xl font-bold text-gray-600 font-serif">“</span>
    <p class="text-xl italic text-gray-800 mb-8 text-left">
      {description}
    </p>
    <h2 class="text-3xl font-bold text-primary mb-6">
      {chapterTitle || title}
    </h2>
    <a
      href="/novel/{id}"
      class="inline-block bg-red-800 text-white px-8 py-3 rounded-full hover:bg-red-700 transition duration-300"
    >
      开始阅读
    </a>
  </div>
</section>
