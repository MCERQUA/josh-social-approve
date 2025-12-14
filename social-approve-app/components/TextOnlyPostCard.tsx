'use client';

import { PostWithApproval } from '@/types';
import { useState } from 'react';

interface TextOnlyPostCardProps {
  post: PostWithApproval;
  onApprove: (postId: number) => void;
  onReject: (postId: number) => void;
  onUpdate?: (postId: number, updatedContent: { title: string; content: string }) => void;
  onDelete?: (postId: number) => void;
}

export default function TextOnlyPostCard({ post, onApprove, onReject, onUpdate, onDelete }: TextOnlyPostCardProps) {
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
            className="text-blue-400 hover:text-blue-300 underline font-medium"
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

  const getStatusColor = () => {
    switch (post.approval?.status) {
      case 'approved':
        return 'border-green-500/50 bg-slate-800/80';
      case 'rejected':
        return 'border-red-500/50 bg-slate-800/80';
      default:
        return 'border-slate-600 bg-slate-800/80';
    }
  };

  const getStatusBadge = () => {
    switch (post.approval?.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Text Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className={`w-full max-w-2xl rounded-xl border-2 ${getStatusColor()} shadow-lg hover:shadow-xl overflow-hidden transition-all duration-200 relative`}>
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={() => onDelete(post.id)}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
          title="Delete post"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Post Header */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              CCA
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Contractor's Choice Agency</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Post Title */}
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full font-semibold text-white text-lg mb-3 px-3 py-2 bg-slate-700 border-2 border-blue-500 rounded-lg focus:outline-none focus:border-blue-400"
            placeholder="Post title..."
          />
        ) : (
          <h4 className="font-semibold text-white text-lg mb-3">{post.title}</h4>
        )}

        {/* Post Content */}
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={8}
            className="w-full text-slate-200 text-sm leading-relaxed px-3 py-2 bg-slate-700 border-2 border-blue-500 rounded-lg focus:outline-none focus:border-blue-400 resize-y"
            placeholder="Post content..."
          />
        ) : (
          <div className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed bg-slate-700/50 rounded-lg p-4">
            {renderContentWithLinks(post.content)}
          </div>
        )}

        {/* Character Count */}
        <div className="mt-2 flex justify-end">
          <span className={`text-xs ${post.content.length > 280 ? 'text-yellow-400' : 'text-slate-500'}`}>
            {post.content.length} characters
          </span>
        </div>
      </div>

      {/* Rejection Reason (if rejected) */}
      {post.approval?.status === 'rejected' && post.approval.rejection_reason && (
        <div className="p-4 bg-red-500/10 border-t border-red-500/30">
          <p className="text-sm font-bold text-red-400 mb-1">Rejection Reason:</p>
          <p className="text-sm text-red-300">{post.approval.rejection_reason}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-700">
        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="flex-1 px-5 py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
              className="flex-1 px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Approve Text</span>
            </button>
            <button
              onClick={() => onReject(post.id)}
              disabled={post.approval?.status === 'rejected'}
              className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Reject</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
