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
    <div className={`rounded-lg border ${getStatusColor()} shadow-sm overflow-hidden mb-4 transition-all duration-200`}>
      {/* Post Header - Facebook style */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              CCA
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Contractor's Choice Agency</h3>
              <p className="text-xs text-gray-500">
                {new Date(post.created_at).toLocaleDateString()} ·
                <span className="ml-1 capitalize">{post.platform.replace('_', ' ')}</span>
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4 bg-white">
        <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Post Image */}
      <div className="relative w-full bg-gray-100">
        <Image
          src={`/images/${post.image_filename}`}
          alt={post.title}
          width={800}
          height={600}
          className="w-full h-auto object-cover"
          priority={post.post_index < 4}
        />
      </div>

      {/* Rejection Reason (if rejected) */}
      {post.approval?.status === 'rejected' && post.approval.rejection_reason && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
          <p className="text-sm text-red-800">{post.approval.rejection_reason}</p>
        </div>
      )}

      {/* Action Buttons - Facebook style */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => onApprove(post.id)}
            disabled={post.approval?.status === 'approved'}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Approve</span>
          </button>
          <button
            onClick={() => onReject(post.id)}
            disabled={post.approval?.status === 'rejected'}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
}
