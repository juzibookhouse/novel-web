<script lang="ts">
  export let chapter;
</script>

<div class="p-6 border-b-2 border-gray-400 flex items-center justify-between">
  <a
    href={`/novel/${chapter.novel_id}`}
    class="text-red-700 hover:text-primary transition-colors duration-200"
  >
    <h1 class="font-['Ma_Shan_Zheng'] text-2xl text-primary">
      ← {chapter.novels.title}
    </h1>
  </a>
</div>
