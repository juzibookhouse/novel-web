<script lang="ts">
  export let novelId:string, chapterId:string;
</script>
<div class="text-center py-8">
  <p class="text-gray-800 mb-4">请登录后继续阅读</p>
  <a
    href={`/user/login?redirect=/novel/${novelId}/chapter/${chapterId}`}
    class="inline-block bg-primary text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors"
  >
    立即登录
  </a>
</div>
