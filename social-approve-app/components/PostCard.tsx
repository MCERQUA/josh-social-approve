'use client';

import { PostWithApproval } from '@/types';
import Image from 'next/image';
import { useState } from 'react';

interface PostCardProps {
  post: PostWithApproval;
  onApprove: (postId: number) => void;
  onReject: (postId: number) => void;
}

export default function PostCard({ post, onApprove, onReject }: PostCardProps) {
  const getStatusColor = () => {
    switch (post.approval?.status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getStatusBadge = () => {
    switch (post.approval?.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✓ Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            ✗ Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            ⏳ Pending Review
          </span>
        );
    }
  };

  return (
    <div className={`w-full max-w-md rounded-xl border-2 ${getStatusColor()} shadow-md hover:shadow-lg overflow-hidden transition-all duration-200`}>
      {/* Post Header - Facebook style */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              CCA
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Contractor's Choice Agency</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(post.created_at).toLocaleDateString()} ·
                <span className="ml-1 capitalize font-medium">{post.platform.replace('_', ' ')}</span>
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Post Title */}
        <h4 className="font-semibold text-gray-900 text-sm mb-3">{post.title}</h4>

        {/* Post Content */}
        <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Post Image */}
      <div className="relative w-full bg-gray-50">
        <Image
          src={`/images/${post.image_filename}`}
          alt={post.title}
          width={800}
          height={600}
          className="w-full h-auto object-contain"
          priority={post.post_index < 4}
        />
      </div>

      {/* Rejection Reason (if rejected) */}
      {post.approval?.status === 'rejected' && post.approval.rejection_reason && (
        <div className="p-5 bg-red-50 border-t-2 border-red-200">
          <p className="text-sm font-bold text-red-900 mb-2">Rejection Reason:</p>
          <p className="text-sm text-red-800 leading-relaxed">{post.approval.rejection_reason}</p>
        </div>
      )}

      {/* Action Buttons - Facebook style */}
      <div className="p-5 bg-white border-t-2 border-gray-100">
        <div className="flex gap-3">
          <button
            onClick={() => onApprove(post.id)}
            disabled={post.approval?.status === 'approved'}
            className="flex-1 px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>Approve</span>
          </button>
          <button
            onClick={() => onReject(post.id)}
            disabled={post.approval?.status === 'rejected'}
            className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
}
