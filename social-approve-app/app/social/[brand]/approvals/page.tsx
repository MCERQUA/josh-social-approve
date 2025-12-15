'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TextOnlyPostCard from '@/components/TextOnlyPostCard';
import RejectionModal from '@/components/RejectionModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { PostWithApproval } from '@/types';

export const dynamic = 'force-dynamic';

interface Brand {
  id: number;
  slug: string;
  name: string;
  short_name: string;
}

export default function ApprovalsPage() {
  const params = useParams();
  const brandSlug = (params.brand as string)?.toLowerCase();
  const brandPath = `/social/${(params.brand as string)?.toUpperCase()}`;

  const [brand, setBrand] = useState<Brand | null>(null);
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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    postId: number | null;
    postTitle: string;
  }>({
    isOpen: false,
    postId: null,
    postTitle: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (brandSlug) {
      fetchBrandAndPosts();
    }
  }, [brandSlug]);

  const fetchBrandAndPosts = async () => {
    try {
      setLoading(true);

      // Fetch tenant info to get brand
      const tenantRes = await fetch('/api/tenant');
      if (!tenantRes.ok) throw new Error('Failed to fetch tenant');
      const tenantData = await tenantRes.json();

      const foundBrand = tenantData.brands?.find(
        (b: Brand) => b.slug.toLowerCase() === brandSlug
      );

      if (!foundBrand) {
        setError(`Brand "${brandSlug}" not found`);
        return;
      }

      setBrand(foundBrand);

      // Fetch posts for this brand
      const response = await fetch(`/api/posts?brand=${foundBrand.slug}`);
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
      fetchBrandAndPosts();
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
      setRejectionModal({ isOpen: false, postId: null, postTitle: '' });
      fetchBrandAndPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdate = (postId: number, updatedContent: { title: string; content: string }) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, title: updatedContent.title, content: updatedContent.content }
          : post
      )
    );
  };

  const handleDelete = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setDeleteModal({
        isOpen: true,
        postId,
        postTitle: post.title
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.postId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${deleteModal.postId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete post');
      setPosts(prevPosts => prevPosts.filter(post => post.id !== deleteModal.postId));
      setDeleteModal({ isOpen: false, postId: null, postTitle: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateImage = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate image');
      }

      alert('Image generation started! It will appear once deployed.');
      fetchBrandAndPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate image');
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
    rejected: posts.filter(p => p.approval?.status === 'rejected').length,
    imagePending: posts.filter(p => p.approval?.status === 'approved' && p.approval?.image_status === 'pending').length,
    imageApproved: posts.filter(p => p.approval?.status === 'approved' && p.approval?.image_status === 'approved').length,
    fullyApproved: posts.filter(p => p.approval?.status === 'approved' && p.approval?.image_status === 'approved').length
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

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Error: {error || 'Brand not found'}</p>
          <Link href="/social" className="mt-4 inline-block text-cyan-400 hover:text-cyan-300">
            ← Back to Brands
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 shadow-2xl border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto !px-6 !py-6">
          {/* Back Link */}
          <Link href={brandPath} className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {brand.name}
          </Link>

          {/* Title Section */}
          <div className="flex items-center justify-between !mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Text Approval Dashboard</h1>
              <p className="text-sm text-slate-400 mt-3 font-medium tracking-wide">Stage 1: Review Post Content</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`${brandPath}/image-approvals`}
                className={`px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2.5 shadow-lg hover:shadow-2xl font-semibold hover:scale-105 border border-cyan-500 relative ${stats.imagePending > 0 ? 'animate-pulse' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Image Approvals</span>
                {stats.imagePending > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                    {stats.imagePending}
                  </span>
                )}
              </Link>
              <button
                onClick={fetchBrandAndPosts}
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
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
              <span className="text-blue-400 font-medium">Text Review</span>
            </div>
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-slate-400 font-bold text-sm">2</div>
              <span className="text-slate-400 font-medium">Image Review</span>
            </div>
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-slate-400 font-bold text-sm">3</div>
              <span className="text-slate-400 font-medium">Ready to Publish</span>
            </div>
            {stats.fullyApproved > 0 && (
              <div className="ml-auto px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                {stats.fullyApproved} Ready
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 !gap-4 !mb-6">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl !p-5 text-center shadow-lg border border-slate-600 hover:shadow-xl hover:border-slate-500 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-2">{stats.total}</p>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Total Posts</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl !p-5 text-center shadow-lg border border-yellow-500 hover:shadow-xl hover:border-yellow-400 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-2">{stats.pending}</p>
              <p className="text-xs font-semibold text-yellow-100 uppercase tracking-wider">Pending</p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl !p-5 text-center shadow-lg border border-green-500 hover:shadow-xl hover:border-green-400 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-2">{stats.approved}</p>
              <p className="text-xs font-semibold text-green-100 uppercase tracking-wider">Text Approved</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl !p-5 text-center shadow-lg border border-red-500 hover:shadow-xl hover:border-red-400 transition-all duration-200">
              <p className="text-4xl font-bold text-white !mb-2">{stats.rejected}</p>
              <p className="text-xs font-semibold text-red-100 uppercase tracking-wider">Rejected</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex !gap-3 !pt-6 !mt-4 border-t border-slate-700 !pb-2">
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
      <main className="max-w-4xl mx-auto !px-6 !pt-8 !pb-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">No posts found.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12">
            {filteredPosts.map((post) => (
              <TextOnlyPostCard
                key={post.id}
                post={post}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onGenerateImage={handleGenerateImage}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, postId: null, postTitle: '' })}
        onConfirm={handleDeleteConfirm}
        postTitle={deleteModal.postTitle}
        isDeleting={isDeleting}
      />
    </div>
  );
}
