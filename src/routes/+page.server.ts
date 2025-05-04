import { getNovels } from "$lib/supabaseClient";

export async function load() {
  const { data: novels } = await getNovels({});
  
  const ongoingNovels = novels?.filter((novel)=>novel.status === 'ongoing');
  const finishedNovels = novels?.filter((novel)=>novel.status === 'finished');

  let randomNovel = null;
  if (novels?.length) {
    randomNovel = novels[Math.floor(Math.random()*novels.length)];
  }

  return {
    ongoingNovels: ongoingNovels ?? [],
    finishedNovels: finishedNovels ?? [],
    randomNovel
  };
}