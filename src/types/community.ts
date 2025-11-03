export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_photo: string | null;
  author_role: 'user' | 'admin';
  like_count: number;
  comment_count: number;
  is_liked_by_current_user: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_photo: string | null;
  author_role: 'user' | 'admin';
}

export interface CreatePostData {
  content?: string;
  imageFile?: File;
}

export interface UpdatePostData extends CreatePostData {
  id: string;
  currentImageUrl?: string | null;
}
