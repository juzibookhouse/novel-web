<script>
  import { WEBSITE_NAME } from "$lib/constants";
  const date = new Date();
</script>

<!-- About Section -->
<section class="py-24 px-4 bg-primary">
  <div class="max-w-7xl mx-auto">
    <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class=" text-5xl text-primary mb-8">
          关于{WEBSITE_NAME}
        </h2>
        <div class="prose prose-lg mx-auto">
          <p class="text-gray-600 mb-6">
            {WEBSITE_NAME}成立于{date.getFullYear()}年，是一个专注于中文网络文学创作与阅读的综合性平台。我们致力于为读者提供优质的阅读体验，为作者打造理想的创作平台。
          </p>
          <p class="text-gray-600 mb-6">
            在这里，您可以找到各类精品小说，从武侠仙侠到都市言情，应有尽有。我们重视原创内容，尊重知识产权，为作者提供合理的收益分成。
          </p>
          <p class="text-gray-600">
            加入{WEBSITE_NAME}，与我们一起传承中华文化，共创网络文学的美好未来。
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
