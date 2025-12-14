'use client';

import { useEffect, useState } from 'react';
import ImageApprovalCard from '@/components/ImageApprovalCard';
import ImageRejectionModal from '@/components/ImageRejectionModal';
import { PostWithApproval } from '@/types';
import Link from 'next/link';

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

export default function ImageApprovalsPage() {
  const [posts, setPosts] = useState<PostWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    postId: number | null;
    postTitle: string;
  }>({
    isOpen: false,
    postId: null,
    postTitle: ''
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      // Only show posts that have approved text (eligible for image review)
      const eligiblePosts = data.filter((p: PostWithApproval) =>
        p.approval?.status === 'approved'
      );
      setPosts(eligiblePosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveImage = async (postId: number) => {
    try {
      const response = await fetch('/api/image-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          image_status: 'approved'
        })
      });

      if (!response.ok) throw new Error('Failed to approve image');

      // Refresh posts
      fetchPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleRejectImage = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setRejectionModal({
        isOpen: true,
        postId,
        postTitle: post.title
      });
    }
  };

  const handleRejectionSubmit = async (reason: string) => {
    if (!rejectionModal.postId) return;

    try {
      const response = await fetch('/api/image-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: rejectionModal.postId,
          image_status: 'rejected',
          image_rejection_reason: reason
        })
      });

      if (!response.ok) throw new Error('Failed to reject image');

      // Close modal and refresh posts
      setRejectionModal({ isOpen: false, postId: null, postTitle: '' });
      fetchPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.approval?.image_status === filter;
  });

  const stats = {
    total: posts.length,
    pending: posts.filter(p => p.approval?.image_status === 'pending').length,
    approved: posts.filter(p => p.approval?.image_status === 'approved').length,
    rejected: posts.filter(p => p.approval?.image_status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading posts for image approval...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Error: {error}</p>
          <button
            onClick={fetchPosts}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 shadow-2xl border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto !px-6 !py-6">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 !mb-4">
            <Link href="/social/CCA/approvals" className="hover:text-blue-400 transition-colors">
              Text Approvals
            </Link>
            <span>/</span>
            <span className="text-white font-medium">Image Approvals</span>
          </div>

          {/* Title Section */}
          <div className="flex items-center justify-between !mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Image Approval Dashboard</h1>
              <p className="text-sm text-slate-400 mt-3 font-medium tracking-wide">Stage 2: Review Generated Images</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/social/CCA/approvals"
                className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl transition-all duration-200 flex items-center gap-2.5 shadow-lg hover:shadow-xl font-semibold border border-slate-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Text Approvals</span>
              </Link>
              <Link
                href="/social/CCA/schedule"
                className={`px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2.5 shadow-lg hover:shadow-2xl font-semibold hover:scale-105 border border-emerald-500 relative ${stats.approved > 0 ? 'animate-pulse' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Schedule Posts</span>
                {stats.approved > 0 && (
                  <span className="absolute -top-2 -right-2 bg-cyan-400 text-cyan-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                    {stats.approved}
                  </span>
                )}
              </Link>
              <button
                onClick={fetchPosts}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 flex items-center gap-2.5 shadow-lg hover:shadow-2xl font-semibold hover:scale-105 border border-blue-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Workflow Indicator */}
          <div className="flex items-center gap-4 !mb-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-green-400 font-medium">Text Approved</span>
            </div>
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm">2</div>
              <span className="text-cyan-400 font-medium">Image Review</span>
            </div>
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <Link href="/social/CCA/schedule" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-slate-400 font-bold text-sm">3</div>
              <span className="text-slate-400 font-medium">Schedule & Publish</span>
            </Link>
            {stats.approved > 0 && (
              <div className="ml-auto px-3 py-1 bg-emerald-600 text-white text-sm font-medium rounded-full">
                {stats.approved} Ready
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 !gap-4 !mb-6">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl !p-5 text-center shadow-lg border border-slate-600 hover:shadow-xl hover:border-slate-500 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-2">{stats.total}</p>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Text Approved</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl !p-5 text-center shadow-lg border border-yellow-500 hover:shadow-xl hover:border-yellow-400 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-2">{stats.pending}</p>
              <p className="text-xs font-semibold text-yellow-100 uppercase tracking-wider">Image Pending</p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl !p-5 text-center shadow-lg border border-green-500 hover:shadow-xl hover:border-green-400 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-2">{stats.approved}</p>
              <p className="text-xs font-semibold text-green-100 uppercase tracking-wider">Image Approved</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl !p-5 text-center shadow-lg border border-red-500 hover:shadow-xl hover:border-red-400 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-2">{stats.rejected}</p>
              <p className="text-xs font-semibold text-red-100 uppercase tracking-wider">Image Rejected</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex !gap-3 !pt-6 !mt-4 border-t border-slate-700 !pb-2">
            {(['pending', 'all', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all duration-200 capitalize shadow-sm ${
                  filter === f
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xl scale-105 hover:from-cyan-700 hover:to-teal-700 border border-cyan-500'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 hover:shadow-lg'
                }`}
              >
                {f === 'pending' ? 'Needs Review' : f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Posts Grid */}
      <main className="max-w-5xl mx-auto !px-6 !pt-8 !pb-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">
              {filter === 'pending'
                ? 'No images pending review. Approve some text posts first!'
                : 'No posts found in this category.'}
            </p>
            {filter === 'pending' && (
              <Link
                href="/social/CCA/approvals"
                className="inline-block mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Go to Text Approvals
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredPosts.map((post) => (
              <ImageApprovalCard
                key={post.id}
                post={post}
                onApprove={handleApproveImage}
                onReject={handleRejectImage}
              />
            ))}
          </div>
        )}
      </main>

      {/* Image Rejection Modal */}
      <ImageRejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, postId: null, postTitle: '' })}
        onSubmit={handleRejectionSubmit}
        postTitle={rejectionModal.postTitle}
      />
    </div>
  );
}
