import { getCategories, getNovels, getQuotationChapters } from "$lib/supabaseClient";

export async function load() {
  const { data: ongoingNovels } = await getNovels({limit:4,status:'ongoing',is_short:false});
  const { data: finishedNovels } = await getNovels({limit:4,status:'finished',is_short:false});
  const { data: shortNovels } = await getNovels({limit:4,is_short:true});

  const { data: categories} = await getCategories();

  const {data: quotationChapters} = await getQuotationChapters();

  // let randomNovel = null;
  // if (quotationChapters?.length) {
  //   const randomChapter = quotationChapters[Math.floor(Math.random()*quotationChapters.length)];
  // }

  return {
    ongoingNovels: ongoingNovels ?? [],
    finishedNovels: finishedNovels ?? [],
    shortNovels: shortNovels ?? [],
    categories,
    quotationChapters
  };
}