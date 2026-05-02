export interface User {
  username: string;       // PRIMARY KEY
  name: string;
  email: string;
  password: string;
  avatar: string | null;
  posts: number;
  points: number;
  highest_grade: string;
  membershipType: string;
  membershipExpiry: string;
  created_at: string;
}

export interface Sector {
  id: string;
  name: string;
  label_x: number;
  label_y: number;
  color: string;
  image_url?: string;
}

export interface Route {
  id: number;
  sector_id: string;
  code: string;
  name: string;
  grade: string;
  description: string;
  cover_photo: string;
  set_date: string;
  is_active: number;
  tags?: string[];
}

export interface RouteDetail extends Route {
  tags: string[];
  betas: Beta[];
}

export interface Beta {
  id: number;
  route_id: number;
  username: string;       // FK → users.username
  video_url: string;
  video_local_path: string;
  likes: number;
  created_at: string;
}

export interface RouteCompletion {
  id: number;
  route_id: number;
  username: string;       // FK → users.username
  attempts: string;
  video_url: string;
  video_local_path: string;
  created_at: string;
}

export interface CommunityPost {
  id: number;
  username: string;       // FK → users.username
  content: string;
  type: string;           // 'text' | 'beta' | 'photo' | 'video'
  image_uri: string;
  video_uri: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  created_at: string;
}
