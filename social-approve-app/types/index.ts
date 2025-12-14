export interface Post {
  id: number;
  post_index: number;
  title: string;
  platform?: string; // 'social' - OneUp posts to all connected platforms automatically
  content: string;
  image_filename: string;
  created_at: string;
  // Image deployment tracking
  image_deploy_status?: 'none' | 'generating' | 'pending_deploy' | 'deployed' | 'failed';
  image_commit_sha?: string;
  image_error?: string;
  image_generated_at?: string;
}

// Image deployment status helpers
export type ImageDeployStatus = Post['image_deploy_status'];

export function isImageDeployed(post: Post): boolean {
  return post.image_deploy_status === 'deployed';
}

export function isImagePendingDeploy(post: Post): boolean {
  return post.image_deploy_status === 'pending_deploy';
}

export function isImageGenerating(post: Post): boolean {
  return post.image_deploy_status === 'generating';
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
  // Scheduling (Stage 3)
  scheduled_for?: string;
  scheduled_status: 'not_scheduled' | 'scheduled' | 'publishing' | 'published' | 'failed';
  oneup_post_id?: string;
  oneup_category_id?: number;
  target_platforms?: string[];
  publish_error?: string;
  published_at?: string;
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

export function isReadyToSchedule(approval: Approval): boolean {
  return isFullyApproved(approval) && approval.scheduled_status === 'not_scheduled';
}

export function isScheduled(approval: Approval): boolean {
  return approval.scheduled_status === 'scheduled';
}

export function isPublished(approval: Approval): boolean {
  return approval.scheduled_status === 'published';
}

// OneUp types
export interface OneUpCategory {
  id: number;
  category_name: string;
  isPaused: number;
  created_at: string;
}

export interface OneUpAccount {
  category_id: number;
  social_network_name: string;
  social_network_id: string;
  social_network_type: string;
}

export interface ScheduleRequest {
  post_id: number;
  scheduled_for: string; // ISO datetime string
  category_id: number;
  platforms: string[]; // social_network_ids or "ALL"
}

export interface ScheduledPost extends PostWithApproval {
  scheduled_for: string;
  target_platforms: string[];
}

// Calendar types
export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: ScheduledPost[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

// Schedule Instance (unified format for calendar from both repeat schedules and one-time posts)
export interface ScheduleInstance {
  id: number;
  schedule_id: number | null;
  post_id: number;
  scheduled_for: string;
  status: 'pending' | 'approved' | 'sending' | 'sent' | 'failed' | 'skipped';
  post_title: string;
  post_content: string;
  post_image: string;
  repeat_type: 'none' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  schedule_status: string;
  is_modified?: boolean;
  source: 'schedule' | 'approval';
}

export interface ScheduleInstancesResponse {
  instances: ScheduleInstance[];
  byDate: Record<string, ScheduleInstance[]>;
  total: number;
  repeatCount: number;
  oneTimeCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}
