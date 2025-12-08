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
  // Text approval (Stage 1)
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at: string;
  // Image approval (Stage 2)
  image_status: 'not_ready' | 'pending' | 'approved' | 'rejected';
  image_rejection_reason?: string;
  image_reviewed_at?: string;
}

export interface PostWithApproval extends Post {
  approval: Approval;
}

// Computed status helpers
export type WorkflowStage = 'text_pending' | 'text_rejected' | 'image_pending' | 'image_rejected' | 'fully_approved';

export function getWorkflowStage(approval: Approval): WorkflowStage {
  if (approval.status === 'pending') return 'text_pending';
  if (approval.status === 'rejected') return 'text_rejected';
  if (approval.image_status === 'pending') return 'image_pending';
  if (approval.image_status === 'rejected') return 'image_rejected';
  return 'fully_approved';
}

export function isFullyApproved(approval: Approval): boolean {
  return approval.status === 'approved' && approval.image_status === 'approved';
}
