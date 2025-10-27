<script lang="ts">
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
  <meta name="viewport" content="width=1024">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SJITD11ECX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);} 
    window.gtag = window.gtag || gtag;
    gtag('js', new Date());
    gtag('config', 'G-SJITD11ECX', { 'send_page_view': true });
  </script>
</svelte:head>

<Header />
<main class="flex-grow mt-18">
  <slot />
</main>
<Footer />