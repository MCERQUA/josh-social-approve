'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CalendarMonthView from '@/components/CalendarMonthView';
import TimelineListView from '@/components/TimelineListView';
import ScheduleModal from '@/components/ScheduleModal';
import { PostWithApproval, OneUpAccount } from '@/types';

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
  const [scheduledPosts, setScheduledPosts] = useState<PostWithApproval[]>([]);
  const [readyPosts, setReadyPosts] = useState<PostWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<PostWithApproval | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDateForScheduling, setSelectedDateForScheduling] = useState<Date | null>(null);
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<OneUpAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

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

  // Fetch scheduled posts for this brand
  const fetchScheduledPosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/schedule?brand=${BRAND_SLUG}`);
      if (!response.ok) throw new Error('Failed to fetch scheduled posts');
      const data = await response.json();
      setScheduledPosts(data);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    }
  }, []);

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

  // Fetch connected accounts when brand category is loaded
  const fetchConnectedAccounts = useCallback(async (categoryId: number) => {
    setLoadingAccounts(true);
    try {
      const response = await fetch(`/api/oneup/accounts?category_id=${categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setConnectedAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // Fetch accounts when brand loads with a category ID
  useEffect(() => {
    if (brand?.oneup_category_id) {
      fetchConnectedAccounts(brand.oneup_category_id);
    }
  }, [brand?.oneup_category_id, fetchConnectedAccounts]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBrand(), fetchScheduledPosts(), fetchReadyPosts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchBrand, fetchScheduledPosts, fetchReadyPosts]);

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
          <div className="flex items-center justify-between">
            {/* Left: Title + Connected Accounts */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-white">Schedule</h1>

              {/* Connected Accounts - Inline */}
              {brand?.oneup_category_id && !loadingAccounts && connectedAccounts.length > 0 && (
                <div className="flex items-center gap-1.5 pl-4 border-l border-slate-700">
                  <span className="text-slate-500 text-xs mr-1">Publishing to:</span>
                  {connectedAccounts.slice(0, 4).map((account) => (
                    <div
                      key={account.social_network_id}
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        account.social_network_type === 'facebook_page'
                          ? 'bg-blue-500/20 text-blue-400'
                          : account.social_network_type === 'instagram_business'
                          ? 'bg-pink-500/20 text-pink-400'
                          : account.social_network_type === 'linkedin_page'
                          ? 'bg-sky-500/20 text-sky-400'
                          : account.social_network_type === 'google_business'
                          ? 'bg-amber-500/20 text-amber-400'
                          : account.social_network_type === 'twitter'
                          ? 'bg-slate-500/20 text-slate-400'
                          : 'bg-slate-600/50 text-slate-400'
                      }`}
                      title={account.social_network_name}
                    >
                      {account.social_network_type === 'facebook_page' && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                      {account.social_network_type === 'instagram_business' && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      )}
                      {account.social_network_type === 'linkedin_page' && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                      {account.social_network_type === 'google_business' && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                        </svg>
                      )}
                      {account.social_network_type === 'twitter' && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )}
                      {!['facebook_page', 'instagram_business', 'linkedin_page', 'google_business', 'twitter'].includes(account.social_network_type) && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                    </div>
                  ))}
                  {connectedAccounts.length > 4 && (
                    <span className="text-slate-500 text-xs">+{connectedAccounts.length - 4}</span>
                  )}
                </div>
              )}
            </div>

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
