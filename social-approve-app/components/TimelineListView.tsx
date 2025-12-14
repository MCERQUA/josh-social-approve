'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { PostWithApproval } from '@/types';

interface TimelineListViewProps {
  scheduledPosts: PostWithApproval[];
  onPostClick: (post: PostWithApproval) => void;
  onUnschedule: (postId: number) => void;
}

interface DayGroup {
  date: string;
  displayDate: string;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
  posts: PostWithApproval[];
}

export default function TimelineListView({
  scheduledPosts,
  onPostClick,
  onUnschedule,
}: TimelineListViewProps) {
  // Group posts by day
  const dayGroups = useMemo(() => {
    const groups: Map<string, PostWithApproval[]> = new Map();

    scheduledPosts.forEach((post) => {
      if (!post.approval?.scheduled_for) return;

      const date = new Date(post.approval.scheduled_for);
      const dateKey = date.toISOString().split('T')[0];

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(post);
    });

    // Sort posts within each day by time
    groups.forEach((posts) => {
      posts.sort((a, b) => {
        const timeA = new Date(a.approval?.scheduled_for || 0).getTime();
        const timeB = new Date(b.approval?.scheduled_for || 0).getTime();
        return timeA - timeB;
      });
    });

    // Convert to array and sort by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result: DayGroup[] = Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dateKey, posts]) => {
        const date = new Date(dateKey + 'T00:00:00');
        const isToday = date.getTime() === today.getTime();
        const isTomorrow = date.getTime() === tomorrow.getTime();
        const isPast = date.getTime() < today.getTime();

        // Format display date
        let displayDate: string;
        if (isToday) {
          displayDate = 'Today';
        } else if (isTomorrow) {
          displayDate = 'Tomorrow';
        } else {
          displayDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });
        }

        return {
          date: dateKey,
          displayDate,
          isToday,
          isTomorrow,
          isPast,
          posts,
        };
      });

    return result;
  }, [scheduledPosts]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500';
      case 'failed':
        return 'bg-rose-500';
      case 'publishing':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'failed':
        return 'Failed';
      case 'publishing':
        return 'Publishing...';
      default:
        return 'Scheduled';
    }
  };

  if (dayGroups.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
        <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-white mb-2">No Scheduled Posts</h3>
        <p className="text-slate-400 text-sm">
          Posts that you schedule will appear here in timeline view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dayGroups.map((group) => (
        <div key={group.date} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Day Header */}
          <div
            className={`px-5 py-3 border-b border-slate-700/50 ${
              group.isToday
                ? 'bg-blue-500/10'
                : group.isPast
                ? 'bg-slate-900/50'
                : 'bg-slate-800/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    group.isToday ? 'bg-blue-500' : group.isPast ? 'bg-slate-500' : 'bg-emerald-500'
                  }`}
                />
                <span
                  className={`font-semibold ${
                    group.isToday ? 'text-blue-400' : group.isPast ? 'text-slate-400' : 'text-white'
                  }`}
                >
                  {group.displayDate}
                </span>
                <span className="text-slate-500 text-sm">
                  {group.posts.length} post{group.posts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Posts Horizontal Scroll */}
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
              {group.posts.map((post) => (
                <div
                  key={post.id}
                  className="flex-shrink-0 w-72 bg-slate-700/50 rounded-lg border border-slate-600/50 overflow-hidden hover:border-slate-500/50 transition-colors"
                >
                  {/* Post Image */}
                  <div
                    className="relative h-36 cursor-pointer"
                    onClick={() => onPostClick(post)}
                  >
                    <Image
                      src={`/images/${post.image_filename}`}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(
                          post.approval?.scheduled_status
                        )}`}
                      >
                        {getStatusLabel(post.approval?.scheduled_status)}
                      </span>
                    </div>
                    {/* Time Badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 rounded bg-black/60 text-xs font-medium text-white">
                        {formatTime(post.approval?.scheduled_for || '')}
                      </span>
                    </div>
                  </div>

                  {/* Post Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-white text-sm mb-1 line-clamp-1">
                      {post.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-3">
                      {post.content.substring(0, 80)}...
                    </p>

                    {/* Platform Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          post.platform === 'facebook'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {post.platform === 'facebook' ? 'Facebook' : 'Google Business'}
                      </span>

                      {/* Actions */}
                      {post.approval?.scheduled_status === 'scheduled' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnschedule(post.id);
                          }}
                          className="text-slate-400 hover:text-rose-400 transition-colors"
                          title="Unschedule"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
