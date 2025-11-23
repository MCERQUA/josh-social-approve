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
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 shadow-2xl border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto !px-8 !pt-16 !pb-12">
          {/* Title Section */}
          <div className="flex items-center justify-between !mb-24">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Social Media Approval Dashboard</h1>
              <p className="text-sm text-slate-400 mt-3 font-medium tracking-wide">Contractor's Choice Agency</p>
            </div>
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

          {/* Stats */}
          <div className="grid grid-cols-4 !gap-8 !mb-20">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl !p-8 text-center shadow-lg border border-slate-600 hover:shadow-xl hover:border-slate-500 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-4">{stats.total}</p>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Total Posts</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl !p-8 text-center shadow-lg border border-yellow-500 hover:shadow-xl hover:border-yellow-400 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-4">{stats.pending}</p>
              <p className="text-xs font-semibold text-yellow-100 uppercase tracking-wider">Pending</p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl !p-8 text-center shadow-lg border border-green-500 hover:shadow-xl hover:border-green-400 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-4">{stats.approved}</p>
              <p className="text-xs font-semibold text-green-100 uppercase tracking-wider">Approved</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl !p-8 text-center shadow-lg border border-red-500 hover:shadow-xl hover:border-red-400 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-4">{stats.rejected}</p>
              <p className="text-xs font-semibold text-red-100 uppercase tracking-wider">Rejected</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex !gap-4 !pt-16 !mt-10 border-t border-slate-700 !pb-6">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all duration-200 capitalize shadow-sm ${
                  filter === f
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl scale-105 hover:from-blue-700 hover:to-blue-800 border border-blue-500'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 hover:shadow-lg'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Posts Feed */}
      <main className="max-w-4xl mx-auto !px-6 !pt-24 !pb-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">No posts found.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12">
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
