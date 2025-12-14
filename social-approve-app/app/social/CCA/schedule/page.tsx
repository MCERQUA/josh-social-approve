'use client';

import { useEffect, useState, useCallback } from 'react';
import CalendarMonthView from '@/components/CalendarMonthView';
import TimelineListView from '@/components/TimelineListView';
import ScheduleModal from '@/components/ScheduleModal';
import { PostWithApproval, ScheduleInstance, ScheduleInstancesResponse } from '@/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Brand slug for this page - extracted from the URL path
const BRAND_SLUG = 'cca';

type ViewMode = 'calendar' | 'timeline';

interface BrandConfig {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  oneup_category_id: number | null;
  color: string;
}

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [instances, setInstances] = useState<ScheduleInstance[]>([]);
  const [readyPosts, setReadyPosts] = useState<PostWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<PostWithApproval | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [brand, setBrand] = useState<BrandConfig | null>(null);

  // Fetch brand config
  const fetchBrand = useCallback(async () => {
    try {
      const response = await fetch(`/api/brands/${BRAND_SLUG}`);
      if (!response.ok) throw new Error('Failed to fetch brand');
      const data = await response.json();
      setBrand(data);
    } catch (error) {
      console.error('Error fetching brand:', error);
    }
  }, []);

  // Fetch schedule instances for calendar (unified: repeat schedules + one-time posts)
  const fetchInstances = useCallback(async () => {
    try {
      // Get 3 months before and 6 months after current month
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, 0);

      const response = await fetch(
        `/api/schedules/instances?brand=${BRAND_SLUG}&start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch instances');
      const data: ScheduleInstancesResponse = await response.json();
      setInstances(data.instances);
    } catch (error) {
      console.error('Error fetching instances:', error);
    }
  }, [currentDate]);

  // Fetch posts ready to schedule for this brand
  const fetchReadyPosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/schedule/ready?brand=${BRAND_SLUG}`);
      if (!response.ok) throw new Error('Failed to fetch ready posts');
      const data = await response.json();
      setReadyPosts(data);
    } catch (error) {
      console.error('Error fetching ready posts:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBrand(), fetchInstances(), fetchReadyPosts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchBrand, fetchInstances, fetchReadyPosts]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToMonth = (date: Date) => {
    setCurrentDate(date);
  };

  const handleDateClick = (date: Date) => {
    // Could open a day detail modal or initiate scheduling for that date
    console.log('Date clicked:', date);
  };

  const handleInstanceClick = (instance: ScheduleInstance) => {
    // Instance click is now handled in CalendarMonthView modal
    console.log('Instance clicked:', instance.post_title);
  };

  // Approve and send a pre-scheduled post to OneUp
  const handleApproveToOneUp = async (instance: ScheduleInstance) => {
    if (!brand?.oneup_category_id) {
      alert('No OneUp category configured for this brand');
      return;
    }

    // Confirm before sending
    const confirmed = confirm(
      `Are you sure you want to send this post to OneUp?\n\n` +
      `"${instance.post_title}"\n\n` +
      `This will post to:\n` +
      `- ${brand.name} (Category #${brand.oneup_category_id})\n\n` +
      `This action cannot be undone from this dashboard.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/schedule/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: instance.post_id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish');
      }

      // Refresh data
      await fetchInstances();
      alert('Post sent to OneUp successfully!');
    } catch (error) {
      console.error('Error publishing to OneUp:', error);
      alert(`Failed to send to OneUp: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSchedulePost = (post: PostWithApproval) => {
    setSelectedPost(post);
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (
    postId: number,
    scheduledFor: string,
    categoryId: number,
    platforms: string[]
  ) => {
    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        scheduled_for: scheduledFor,
        category_id: categoryId,
        platforms,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to schedule post');
    }

    // Refresh data
    await Promise.all([fetchInstances(), fetchReadyPosts()]);
  };

  const handleUnschedule = async (instanceOrPostId: number, source?: 'schedule' | 'approval') => {
    if (!confirm('Are you sure you want to unschedule this post?')) return;

    try {
      if (source === 'approval') {
        // Old system - use the original unschedule endpoint
        const response = await fetch(`/api/schedule?post_id=${instanceOrPostId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to unschedule post');
      } else {
        // New system - skip the instance
        const response = await fetch(`/api/schedules/instances?id=${instanceOrPostId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to skip instance');
      }

      // Refresh data
      await Promise.all([fetchInstances(), fetchReadyPosts()]);
    } catch (error) {
      console.error('Error unscheduling:', error);
      alert('Failed to unschedule post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Compact Header */}
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title + Ready Count */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-white">Schedule</h1>
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-sm rounded border border-cyan-500/30">
                {readyPosts.length} ready
              </span>
            </div>

            {/* Center: Category Info */}
            {brand?.oneup_category_id && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Category:</span>
                <span className="text-white text-sm font-medium">{brand.name}</span>
                <span className="text-slate-500 text-xs">#{brand.oneup_category_id}</span>
              </div>
            )}

            {/* Right: View Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-lg">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'timeline'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Timeline
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Posts Ready to Schedule (Sidebar) */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 sticky top-16">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ready to Schedule ({readyPosts.length})
              </h3>

              {readyPosts.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  No posts ready. Complete text and image approval first.
                </p>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {readyPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-slate-700/50 rounded-lg p-2 hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex gap-2">
                        {/* Thumbnail */}
                        {post.image_filename && (
                          <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-slate-600">
                            <img
                              src={`/images/${post.image_filename}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium mb-1 line-clamp-2">
                            {post.title}
                          </h4>
                          <button
                            onClick={() => handleSchedulePost(post)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          >
                            Schedule
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calendar/Timeline View */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {viewMode === 'calendar' ? (
              <CalendarMonthView
                currentDate={currentDate}
                instances={instances}
                onDateClick={handleDateClick}
                onInstanceClick={handleInstanceClick}
                onApproveToOneUp={handleApproveToOneUp}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onGoToMonth={handleGoToMonth}
              />
            ) : (
              <TimelineListView
                instances={instances}
                onInstanceClick={handleInstanceClick}
                onUnschedule={handleUnschedule}
              />
            )}
          </div>
        </div>
      </main>

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        post={selectedPost}
        brandCategoryId={brand?.oneup_category_id ?? null}
        brandName={brand?.name ?? 'Unknown Brand'}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedPost(null);
        }}
        onSchedule={handleScheduleSubmit}
      />

    </div>
  );
}
