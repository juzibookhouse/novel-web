<script lang="ts">
    import { onMount } from "svelte";

  export let chapter;

  let fontSize = 16;

  onMount(()=>{
    // Load saved font size from localStorage
    const savedFontSize = localStorage.getItem("reading-font-size");
    if (savedFontSize) {
      fontSize = parseInt(savedFontSize);
    }
  });

  function changeFontSize(delta: number) {
    fontSize = Math.max(12, Math.min(24, fontSize + delta));
    localStorage.setItem("reading-font-size", fontSize.toString());
  }

</script>
<!-- Reading Controls -->
<div class="py-4 border-b-2 border-red-100 flex justify-center space-x-4">
  <button
    on:click={() => changeFontSize(-2)}
    class="px-3 py-1 rounded-full"
  >
    A-
  </button>
  <button
    on:click={() => changeFontSize(2)}
    class="px-3 py-1 rounded-full"
  >
    A+
  </button>
</div>
<div class="prose prose-lg max-w-none">
  <div
    class="text-gray-800 leading-relaxed"
    style="font-size: {fontSize}px"
  >
    {@html chapter.content || "本章节暂无内容"}
  </div>
</div>