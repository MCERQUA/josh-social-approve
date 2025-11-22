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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Social Media Approval Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Contractor's Choice Agency</p>
            </div>
            <button
              onClick={fetchPosts}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              <p className="text-xs text-yellow-700">Pending</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
              <p className="text-xs text-green-700">Approved</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              <p className="text-xs text-red-700">Rejected</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 mt-4 border-t border-gray-200 pt-4">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 capitalize ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Posts Feed */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts found.</p>
          </div>
        ) : (
          <div className="space-y-4">
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
