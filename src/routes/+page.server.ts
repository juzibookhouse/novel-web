import { getCategories, getNovels, getQuotationChapters } from "$lib/supabaseClient";

export async function load() {
  const { data: ongoingNovels } = await getNovels({limit:4,status:'ongoing'});
  const { data: finishedNovels } = await getNovels({limit:4,status:'finished'});

  const { data: categories} = await getCategories();

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