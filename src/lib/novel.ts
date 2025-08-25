const NOVEL_STATUS:{[key:string]:string} = {
  ongoing: '连载中',
  finished: '完结'
}

const PUBLIC_TEXT = '开放阅读';
const PRIVATE_TEXT = '仅对注册用户阅读';
const VIP_TEXT = '仅对会员阅读';

export const FREE_OPTIONS = [
  {value: "", label:"取决于章节"},
  {value: "public", label:PUBLIC_TEXT},
  {value: "private", label:PRIVATE_TEXT},
  {value: "vip", label:VIP_TEXT}
]

export const CHAPTER_FREE_OPTIONS = [
  {value: "", label:"取决于小说"},
  {value: "public", label:PUBLIC_TEXT},
  {value: "private", label:PRIVATE_TEXT},
  {value: "vip", label:VIP_TEXT}
]

export const FREE_OPTIONS_MAP:{[key:string]:string} = {
  public: PUBLIC_TEXT,
  private: PRIVATE_TEXT,
  vip: VIP_TEXT,
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
  is_free: string;
  published: boolean;
  created_at: string;
  chapter_order: number;
  quotation?: string;
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
  is_free?: string;
  is_short: boolean;
  published?: boolean;
  pen_name?: string;
  chapters?: [];
  quotation?: string;
  quotation_chapter_id?: string;
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
  is_free?: string;
  is_short?: boolean;
  published?: boolean;
  chapters?: Chapter[];
  tags:[];
}

export const getNovelStatus = (novel:Novel) => {
  return NOVEL_STATUS[novel.status];
}

export const getSortedChapters = (chatpers:Chapter[]) => {
  return chatpers.sort((a, b) => a.chapter_order - b.chapter_order)
}

export const getChapterLength = (chapter:Chapter) => {
  if (!chapter.content) return 0;
  return chapter.content?.replace(/<[^>]*>/g, '').length;
}

export const getNovelWordCount = (novel:Novel) => {
  if (!novel.chapters) return '0';
  const wordCounts = novel.chapters?.reduce((acc, chapter)=> {
    return acc + getChapterLength(chapter)
  },0);
  return formatNumberUnit(wordCounts);
}

export const formatNumberUnit = (num:number, unit = '万', threshold = 10000) => {
  if (typeof num !== 'number' || isNaN(num)) return ''
  
  return num >= threshold 
    ? `${(num / threshold)
        .toFixed(2)
        .replace(/\.?0+$/, '')
        .replace(/\.$/, '')}${unit}`
    : num.toString()
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingSeconds = seconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    return `${hours}小时${minutes}分钟`;
  }
}