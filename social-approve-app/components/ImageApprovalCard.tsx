'use client';

import { PostWithApproval } from '@/types';
import Image from 'next/image';

interface ImageApprovalCardProps {
  post: PostWithApproval;
  onApprove: (postId: number) => void;
  onReject: (postId: number) => void;
}

export default function ImageApprovalCard({ post, onApprove, onReject }: ImageApprovalCardProps) {
  const getImageStatusBadge = () => {
    switch (post.approval?.image_status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Image Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Image Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Image Pending Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            Text Not Yet Approved
          </span>
        );
    }
  };

  const getPlatformIcon = () => {
    if (post.platform === 'facebook') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          FACEBOOK
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs font-bold">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          GOOGLE
        </div>
      );
    }
  };

  const getCardBorderColor = () => {
    switch (post.approval?.image_status) {
      case 'approved':
        return 'border-green-400';
      case 'rejected':
        return 'border-red-400';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className={`w-full max-w-lg rounded-xl border-2 ${getCardBorderColor()} bg-white shadow-md hover:shadow-lg overflow-hidden transition-all duration-200`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              CCA
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Contractor's Choice Agency</h3>
              <p className="text-xs text-gray-500">Post #{post.post_index + 1}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getPlatformIcon()}
          </div>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-gray-900 text-sm">{post.title}</h4>

        {/* Status Badge */}
        <div className="mt-2">
          {getImageStatusBadge()}
        </div>
      </div>

      {/* Image - Large and prominent for review */}
      <div className="relative w-full bg-gray-100">
        <Image
          src={`/images/${post.image_filename}`}
          alt={post.title}
          width={800}
          height={600}
          className="w-full h-auto object-contain"
          priority
        />
      </div>

      {/* Approved Text Preview (collapsed) */}
      <div className="p-4 bg-green-50 border-t border-green-200">
        <p className="text-xs font-semibold text-green-700 mb-1">Approved Text:</p>
        <p className="text-xs text-green-800 line-clamp-3">{post.content}</p>
      </div>

      {/* Rejection Reason (if rejected) */}
      {post.approval?.image_status === 'rejected' && post.approval.image_rejection_reason && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-sm font-bold text-red-900 mb-1">Image Rejection Reason:</p>
          <p className="text-sm text-red-800">{post.approval.image_rejection_reason}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 bg-white border-t-2 border-gray-100">
        <div className="flex gap-3">
          <button
            onClick={() => onApprove(post.id)}
            disabled={post.approval?.image_status === 'approved'}
            className="flex-1 px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>Approve Image</span>
          </button>
          <button
            onClick={() => onReject(post.id)}
            disabled={post.approval?.image_status === 'rejected'}
            className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Reject Image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
