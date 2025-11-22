export interface Post {
  id: number;
  post_index: number;
  title: string;
  platform: 'facebook' | 'google_business';
  content: string;
  image_filename: string;
  created_at: string;
}

export interface Approval {
  id: number;
  post_id: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at: string;
}

export interface PostWithApproval extends Post {
  approval: Approval;
}
