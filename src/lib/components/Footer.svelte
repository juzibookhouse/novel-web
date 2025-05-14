<script>
  import { WEBSITE_NAME } from '$lib/constants';
  
  // 获取当前年份
  const currentYear = new Date().getFullYear();
</script>

<footer class="bg-red-50 text-primary border-t border-primary mt-8">
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row justify-between items-center">
      <div class="mb-4 md:mb-0">
        <div class="flex items-center gap-2">
          <img src="/logo.jpg" alt={WEBSITE_NAME} class="w-8 h-8 rounded-full object-cover" />
          <h3 class="text-xl font-bold font-['Ma_Shan_Zheng']">{WEBSITE_NAME}</h3>
        </div>
        <p class="text-sm mt-2">© {currentYear} {WEBSITE_NAME}. 保留所有权利。</p>
      </div>
      
      <div class="flex flex-wrap justify-center gap-6">
        <!-- <a href="/about" class="hover:underline">关于我们</a>
        <a href="/contact" class="hover:underline">联系我们</a>
        <a href="/terms" class="hover:underline">使用条款</a>
        <a href="/privacy" class="hover:underline">隐私政策</a> -->
      </div>
    </div>
    
    <div class="mt-6 text-center text-sm">
      <p>阅读，分享，创造 - 您的在线文学社区</p>
    </div>
  </div>
</footer>

<style>
  footer a {
    color: var(--text-color);
    transition: opacity 0.2s;
  }
  
  footer a:hover {
    opacity: 0.8;
  }
</style>