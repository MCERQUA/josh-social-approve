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
