export interface Comment {
  id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  parent_id?: string | null;
  user_id?: string;
  user_name?: string;
  replies?: Comment[];
}