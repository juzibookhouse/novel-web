import { getCategories, getNovel, getNovels, getQuotationChapters } from "$lib/supabaseClient";

export async function load() {
  const { data: novels } = await getNovels({});

  const { data: categories} = await getCategories();
  
  const ongoingNovels = novels?.filter((novel)=>novel.status === 'ongoing');
  const finishedNovels = novels?.filter((novel)=>novel.status === 'finished');

  const {data: quotationChapters} = await getQuotationChapters();

  // let randomNovel = null;
  // if (quotationChapters?.length) {
  //   const randomChapter = quotationChapters[Math.floor(Math.random()*quotationChapters.length)];
  // }

  return {
    ongoingNovels: ongoingNovels ?? [],
    finishedNovels: finishedNovels ?? [],
    categories,
    quotationChapters
  };
}