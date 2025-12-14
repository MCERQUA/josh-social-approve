'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CalendarMonthView from '@/components/CalendarMonthView';
import TimelineListView from '@/components/TimelineListView';
import ScheduleModal from '@/components/ScheduleModal';
import { PostWithApproval } from '@/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type ViewMode = 'calendar' | 'timeline';

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [scheduledPosts, setScheduledPosts] = useState<PostWithApproval[]>([]);
  const [readyPosts, setReadyPosts] = useState<PostWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<PostWithApproval | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDateForScheduling, setSelectedDateForScheduling] = useState<Date | null>(null);

  // Fetch scheduled posts
  const fetchScheduledPosts = useCallback(async () => {
    try {
      const response = await fetch('/api/schedule');
      if (!response.ok) throw new Error('Failed to fetch scheduled posts');
      const data = await response.json();
      setScheduledPosts(data);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    }
  }, []);

  // Fetch posts ready to schedule
  const fetchReadyPosts = useCallback(async () => {
    try {
      const response = await fetch('/api/schedule/ready');
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
      await Promise.all([fetchScheduledPosts(), fetchReadyPosts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchScheduledPosts, fetchReadyPosts]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDateForScheduling(date);
    // Could open a day detail modal or initiate scheduling
  };

  const handlePostClick = (post: PostWithApproval) => {
    setSelectedPost(post);
    // Show post details or edit scheduling
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
    await Promise.all([fetchScheduledPosts(), fetchReadyPosts()]);
  };

  const handleUnschedule = async (postId: number) => {
    if (!confirm('Are you sure you want to unschedule this post?')) return;

    try {
      const response = await fetch(`/api/schedule?post_id=${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to unschedule post');

      // Refresh data
      await Promise.all([fetchScheduledPosts(), fetchReadyPosts()]);
    } catch (error) {
      console.error('Error unscheduling post:', error);
      alert('Failed to unschedule post');
    }
  };

  // Stats
  const stats = {
    scheduled: scheduledPosts.filter((p) => p.approval?.scheduled_status === 'scheduled').length,
    published: scheduledPosts.filter((p) => p.approval?.scheduled_status === 'published').length,
    failed: scheduledPosts.filter((p) => p.approval?.scheduled_status === 'failed').length,
    ready: readyPosts.length,
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
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 shadow-2xl border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Title Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Schedule & Publish
              </h1>
              <p className="text-sm text-slate-400 mt-3 font-medium tracking-wide">
                Stage 3: Schedule approved posts for publication
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/social/CCA/image-approvals"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all duration-200 flex items-center gap-2.5 shadow-lg font-semibold border border-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Approvals</span>
              </Link>
            </div>
          </div>

          {/* Workflow Indicator */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-slate-400 font-medium">Text Review</span>
            </div>
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-slate-400 font-medium">Image Review</span>
            </div>
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">3</div>
              <span className="text-blue-400 font-medium">Schedule & Publish</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-5 text-center shadow-lg border border-cyan-500 hover:shadow-xl transition-all duration-200">
              <p className="text-4xl font-bold text-white mb-2">{stats.ready}</p>
              <p className="text-xs font-semibold text-cyan-100 uppercase tracking-wider">Ready to Schedule</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-center shadow-lg border border-blue-500 hover:shadow-xl transition-all duration-200">
              <p className="text-4xl font-bold text-white mb-2">{stats.scheduled}</p>
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Scheduled</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-center shadow-lg border border-emerald-500 hover:shadow-xl transition-all duration-200">
              <p className="text-4xl font-bold text-white mb-2">{stats.published}</p>
              <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Published</p>
            </div>
            <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl p-5 text-center shadow-lg border border-rose-500 hover:shadow-xl transition-all duration-200">
              <p className="text-4xl font-bold text-white mb-2">{stats.failed}</p>
              <p className="text-xs font-semibold text-rose-100 uppercase tracking-wider">Failed</p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 p-1 bg-slate-700/50 rounded-lg w-fit">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Timeline
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Posts Ready to Schedule (Sidebar) */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 sticky top-40">
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
                      className="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 transition-colors"
                    >
                      <h4 className="text-white text-sm font-medium mb-1 line-clamp-1">
                        {post.title}
                      </h4>
                      <p className="text-slate-400 text-xs mb-2 line-clamp-2">
                        {post.content.substring(0, 60)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            post.platform === 'facebook'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {post.platform === 'facebook' ? 'FB' : 'GBP'}
                        </span>
                        <button
                          onClick={() => handleSchedulePost(post)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                        >
                          Schedule
                        </button>
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
                scheduledPosts={scheduledPosts}
                onDateClick={handleDateClick}
                onPostClick={handlePostClick}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
            ) : (
              <TimelineListView
                scheduledPosts={scheduledPosts}
                onPostClick={handlePostClick}
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
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedPost(null);
        }}
        onSchedule={handleScheduleSubmit}
      />
    </div>
  );
}
