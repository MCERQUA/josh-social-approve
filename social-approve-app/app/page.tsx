'use client';

import { useEffect, useState } from 'react';
import PostCard from '@/components/PostCard';
import RejectionModal from '@/components/RejectionModal';
import { PostWithApproval } from '@/types';

export default function Home() {
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: number) => {
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          status: 'approved'
        })
      });

      if (!response.ok) throw new Error('Failed to approve post');

      // Refresh posts
      fetchPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleReject = (postId: number) => {
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
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: rejectionModal.postId,
          status: 'rejected',
          rejection_reason: reason
        })
      });

      if (!response.ok) throw new Error('Failed to reject post');

      // Close modal and refresh posts
      setRejectionModal({ isOpen: false, postId: null, postTitle: '' });
      fetchPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.approval?.status === filter;
  });

  const stats = {
    total: posts.length,
    pending: posts.filter(p => p.approval?.status === 'pending').length,
    approved: posts.filter(p => p.approval?.status === 'approved').length,
    rejected: posts.filter(p => p.approval?.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading posts...</p>
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
      <header className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-b-2 border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Media Approval Dashboard</h1>
              <p className="text-sm text-gray-600 mt-2 font-medium">Contractor's Choice Agency</p>
            </div>
            <button
              onClick={fetchPosts}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center shadow-sm border border-gray-200">
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</p>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Posts</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center shadow-sm border border-yellow-200">
              <p className="text-3xl font-bold text-yellow-900 mb-1">{stats.pending}</p>
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Pending</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center shadow-sm border border-green-200">
              <p className="text-3xl font-bold text-green-900 mb-1">{stats.approved}</p>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Approved</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center shadow-sm border border-red-200">
              <p className="text-3xl font-bold text-red-900 mb-1">{stats.rejected}</p>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Rejected</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 border-t-2 border-gray-200 pt-5">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 capitalize shadow-sm ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Posts Feed */}
      <main className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">No posts found.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </main>

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, postId: null, postTitle: '' })}
        onSubmit={handleRejectionSubmit}
        postTitle={rejectionModal.postTitle}
      />
    </div>
  );
}
