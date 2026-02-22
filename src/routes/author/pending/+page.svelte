<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
</script>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h2 class="text-4xl text-primary mb-2">
        {WEBSITE_NAME}
      </h2>
      <p class="text-lg text-red-700">
        作家申请已提交
      </p>
    </div>
    
    <div class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded border-2 border-gray-400 shadow">
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        <h3 class="text-xl font-medium text-gray-900 mb-4">请等待作家申请通过</h3>
        
        <p class="text-gray-600 mb-4">
          您的作家申请已成功提交，我们的管理员将尽快审核您的申请。
        </p>
        
        <p class="text-gray-600 mb-4">
          审核通过后，届时您可以登录并开始发布您的作品。
        </p>
        
        <div class="mt-6 pt-4 border-t border-gray-200">
          <a href="/" class="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200">
            返回首页
          </a>
        </div>
      </div>
    </div>
  </div>
</div>