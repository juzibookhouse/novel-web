<script lang="ts">
  export let randomNovel;
  const {title, description, id, chapters} = randomNovel;
  const chapterTitle = chapters.length ? chapters[0].title : '';
</script>

<!-- Featured Novel Section -->
<section class="relative py-24 bg-primary overflow-hidden">
  <a class="max-w-5xl mx-auto px-4 text-center block" href="/novel/{id}">
    <span class="text-9xl font-bold text-gray-600 font-serif">“</span>
    <p class="text-xl italic text-gray-800 mb-8 text-left">
      {description}
    </p>
    <h2 class="text-xl font-bold text-primary mb-6">
      {title} {chapterTitle}
    </h2>

  </a>
</section>
