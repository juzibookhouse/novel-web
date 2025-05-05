const NOVEL_STATUS:{[key:string]:string} = {
  ongoing: '连载中',
  finished: '完结'
}

export interface Category {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
  user_id?: string;
}

export interface Chapter {
  id: string;
  title: string;
  content?: string;
  novel_id: string;
  is_free: boolean;
  created_at: string;
  chapter_order: number;
}

export interface NewNovel {
  id?: string;
  title: string;
  description: string;
  category_id: string;
  tags:[];
  status: string;
  cover_url?: string;
  cover_file?: File;
  is_free?: boolean;
}

export interface Novel {
  id: string;
  title: string;
  description: string;
  status: string;
  user_id: string;
  created_at: string;
  category_id?: string;
  cover_url?: string;
  is_free?: boolean;
  chapters?: Chapter[];
  tags:[];
}

export const getNovelStatus = (novel:Novel) => {
  return NOVEL_STATUS[novel.status];
}

export const getSortedChapters = (chatpers:Chapter[]) => {
  return chatpers.sort((a, b) => a.chapter_order - b.chapter_order)
}