<script>
  import { WEBSITE_NAME } from "$lib/constants";
  const date = new Date();
</script>

<!-- About Section -->
<section class="py-24 px-4">
  <div class="max-w-7xl mx-auto">
    <div class="bg-white/90 backdrop-blur-sm rounded p-8 shadow-xl">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class=" text-5xl text-primary mb-8">
          关于{WEBSITE_NAME}
        </h2>
        <div class="prose prose-lg mx-auto">
          <p class="text-gray-600 mb-6">
            {WEBSITE_NAME}是一个专注于精品原创网络文学的社区。
          </p>
          <p class="text-gray-600 mb-6">
            我们希望这里既是作者安静、纯粹的创作空间，
也是读者可以安心沉浸的阅读之地——没有碍眼的弹窗，没有杂乱的链接，只有文字与故事本身。
          </p>
          <p class="text-gray-600">
            部分优质内容将以会员形式呈现，订阅会员后，即可畅读全站内容，无额外付费。
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
