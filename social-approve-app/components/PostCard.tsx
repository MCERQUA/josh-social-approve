'use client';

import { PostWithApproval } from '@/types';
import Image from 'next/image';
import { useState } from 'react';

interface PostCardProps {
  post: PostWithApproval;
  onApprove: (postId: number) => void;
  onReject: (postId: number) => void;
  onUpdate?: (postId: number, updatedContent: { title: string; content: string }) => void;
  onDelete?: (postId: number) => void;
}

export default function PostCard({ post, onApprove, onReject, onUpdate, onDelete }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);

  // Convert URLs in text to clickable links
  const renderContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent
        })
      });

      if (!response.ok) throw new Error('Failed to update post');

      // Update the local post data
      post.title = editedTitle;
      post.content = editedContent;

      setIsEditing(false);
      if (onUpdate) {
        onUpdate(post.id, { title: editedTitle, content: editedContent });
      }
    } catch (error) {
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(post.title);
    setEditedContent(post.content);
    setIsEditing(false);
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
    <div className={`w-full max-w-md rounded-xl border-2 ${getStatusColor()} shadow-md hover:shadow-lg overflow-hidden transition-all duration-200 relative`}>
      {/* Delete Button - X in corner */}
      {onDelete && (
        <button
          onClick={() => onDelete(post.id)}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-gray-800 bg-opacity-70 hover:bg-red-600 hover:bg-opacity-100 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
          title="Delete post"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Post Header - Facebook style */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              CCA
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Contractor's Choice Agency</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getPlatformIcon()}
            {getStatusBadge()}
          </div>
        </div>

        {/* Post Title */}
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full font-semibold text-gray-900 text-sm mb-3 px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="Post title..."
          />
        ) : (
          <h4 className="font-semibold text-gray-900 text-sm mb-3">{post.title}</h4>
        )}

        {/* Post Content */}
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={8}
            className="w-full text-gray-800 text-sm leading-relaxed px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600 resize-y"
            placeholder="Post content..."
          />
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
            {renderContentWithLinks(post.content)}
          </p>
        )}
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
        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="flex-1 px-5 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          </div>
        ) : (
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
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
