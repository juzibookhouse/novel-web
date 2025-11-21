<script lang="ts">
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { afterNavigate } from '$app/navigation';
  import { onMount } from 'svelte';

  function sendPageView(url = typeof location !== 'undefined' ? location.href : '') {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_location: url,
        page_path: typeof location !== 'undefined' ? location.pathname : undefined,
        page_title: typeof document !== 'undefined' ? document.title : undefined
      });
    }
  }

  onMount(() => {
    sendPageView();
    afterNavigate(() => {
      sendPageView();
    });
  });
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
    // disable automatic page_view so we can send page_view manually from the client
    gtag('config', 'G-SJITD11ECX', { 'send_page_view': false });
  </script>
</svelte:head>

<Header />
<main class="flex-grow mt-18">
  <slot />
</main>
<Footer />