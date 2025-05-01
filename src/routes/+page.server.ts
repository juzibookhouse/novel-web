import { supabase } from "$lib/supabaseClient";

export async function load() {
  const { data: novels } = await supabase
    .from("novels")
    .select('id,title,description,updated_at,status,cover_url')
    .limit(6)
    .order('created_at', { ascending: false });
  
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