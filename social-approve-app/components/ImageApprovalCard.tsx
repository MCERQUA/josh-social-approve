'use client';

import { PostWithApproval } from '@/types';
import Image from 'next/image';
import { useState } from 'react';
import LogoEditor from './LogoEditor';

interface ImageApprovalCardProps {
  post: PostWithApproval;
  onApprove: (postId: number) => void;
  onReject: (postId: number) => void;
  onGenerateImage?: (postId: number, instructions?: string) => Promise<void>;
  onRefresh?: () => void;
  logoUrl?: string;
  brandName?: string;
}

export default function ImageApprovalCard({
  post,
  onApprove,
  onReject,
  onGenerateImage,
  onRefresh,
  logoUrl,
  brandName
}: ImageApprovalCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState('');
  const [imageError, setImageError] = useState(false);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  // Check if post has a real image (not placeholder)
  const hasRealImage = post.image_filename &&
    !post.image_filename.includes('placeholder') &&
    post.image_deploy_status === 'deployed';

  const isImageGenerating = post.image_deploy_status === 'generating';
  const isImagePendingDeploy = post.image_deploy_status === 'pending_deploy';
  const isImageFailed = post.image_deploy_status === 'failed';
  const needsImage = !hasRealImage && !isImageGenerating && !isImagePendingDeploy;

  const handleGenerateImage = async (instructions?: string) => {
    if (!onGenerateImage) return;

    setIsGenerating(true);
    setShowRegenerateModal(false);
    setRegenerateInstructions('');

    try {
      await onGenerateImage(post.id, instructions);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveLogoMerge = async (mergedImageBase64: string) => {
    setIsSavingLogo(true);
    try {
      const response = await fetch('/api/images/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          image_base64: mergedImageBase64
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save image');
      }

      setShowLogoEditor(false);
      alert('Image with logo saved! Deploying now (~2-5 min)');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save image');
    } finally {
      setIsSavingLogo(false);
    }
  };

  const getImageStatusBadge = () => {
    if (isGenerating || isImageGenerating) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating Image...
        </span>
      );
    }

    if (isImagePendingDeploy) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
          <svg className="w-4 h-4 mr-1.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Deploying (~2-5 min)
        </span>
      );
    }

    if (isImageFailed) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Generation Failed
        </span>
      );
    }

    if (needsImage) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Needs Image
        </span>
      );
    }

    switch (post.approval?.image_status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Image Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Image Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ready for Review
          </span>
        );
    }
  };

  const getCardBorderColor = () => {
    if (isGenerating || isImageGenerating) return 'border-blue-500/50';
    if (isImagePendingDeploy) return 'border-purple-500/50';
    if (isImageFailed || needsImage) return 'border-yellow-500/50';

    switch (post.approval?.image_status) {
      case 'approved':
        return 'border-green-500/50';
      case 'rejected':
        return 'border-red-500/50';
      default:
        return 'border-slate-600';
    }
  };

  return (
    <>
      <div className={`w-full max-w-lg rounded-xl border-2 ${getCardBorderColor()} bg-slate-800/80 shadow-lg hover:shadow-xl overflow-hidden transition-all duration-200`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                CCA
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Contractor's Choice Agency</h3>
                <p className="text-xs text-slate-400">Post #{post.post_index !== undefined ? post.post_index + 1 : post.id}</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <h4 className="font-semibold text-white text-sm mb-2">{post.title}</h4>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {getImageStatusBadge()}
            {(isImagePendingDeploy || isImageGenerating) && onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Refresh status"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Image Area */}
        <div className="relative w-full bg-slate-900 min-h-[200px]">
          {needsImage || isImageFailed ? (
            // No image - show placeholder with generate button
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {isImageFailed && post.image_error && (
                <p className="text-red-400 text-xs mb-3 text-center">{post.image_error}</p>
              )}
              <p className="text-slate-400 text-sm mb-4">No image generated yet</p>
              {onGenerateImage && (
                <button
                  onClick={() => handleGenerateImage()}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isGenerating ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Image
                    </>
                  )}
                </button>
              )}
            </div>
          ) : isImageGenerating || isImagePendingDeploy ? (
            // Image is being generated or deployed
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4 relative">
                <svg className="w-12 h-12 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
              </div>
              <p className="text-slate-300 text-sm mb-1">
                {isImageGenerating ? 'Generating your image...' : 'Deploying to server...'}
              </p>
              <p className="text-slate-500 text-xs">
                {isImagePendingDeploy ? 'This takes about 2-5 minutes' : 'Please wait'}
              </p>
            </div>
          ) : (
            // Has image - show it
            <>
              {!imageError ? (
                <Image
                  src={`/images/${post.image_filename}`}
                  alt={post.title}
                  width={1024}
                  height={1024}
                  className="w-full h-auto"
                  style={{ aspectRatio: '1/1' }}
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <p className="text-red-400 text-sm">Image failed to load</p>
                  <p className="text-slate-500 text-xs mt-1">{post.image_filename}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Approved Text Preview */}
        <div className="p-4 bg-green-500/10 border-t border-green-500/30">
          <p className="text-xs font-semibold text-green-400 mb-1">Approved Text:</p>
          <p className="text-xs text-green-300/80 line-clamp-3">{post.content}</p>
        </div>

        {/* Rejection Reason */}
        {post.approval?.image_status === 'rejected' && post.approval.image_rejection_reason && (
          <div className="p-4 bg-red-500/10 border-t border-red-500/30">
            <p className="text-sm font-bold text-red-400 mb-1">Image Rejection Reason:</p>
            <p className="text-sm text-red-300">{post.approval.image_rejection_reason}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-700">
          {hasRealImage && !isGenerating && !isImageGenerating && !isImagePendingDeploy ? (
            <div className="space-y-3">
              {/* Main action row */}
              <div className="flex gap-3">
                <button
                  onClick={() => onApprove(post.id)}
                  disabled={post.approval?.image_status === 'approved'}
                  className="flex-1 px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => setShowRegenerateModal(true)}
                  className="flex-1 px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Regenerate</span>
                </button>
                <button
                  onClick={() => onReject(post.id)}
                  disabled={post.approval?.image_status === 'rejected'}
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Logo edit button - only show if logo available */}
              {logoUrl && (
                <button
                  onClick={() => setShowLogoEditor(true)}
                  className="w-full px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Logo Position</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400 text-sm py-2">
              {isGenerating || isImageGenerating ? 'Image generation in progress...' :
               isImagePendingDeploy ? 'Waiting for deployment...' :
               'Generate an image to continue'}
            </div>
          )}
        </div>
      </div>

      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Regenerate Image</h3>
              <p className="text-sm text-slate-400 mt-1">Provide instructions to improve the image</p>
            </div>

            <div className="p-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Instructions (optional)
              </label>
              <textarea
                value={regenerateInstructions}
                onChange={(e) => setRegenerateInstructions(e.target.value)}
                rows={4}
                placeholder="E.g., Make it more professional, use warmer colors, show construction equipment..."
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                Leave blank to regenerate with the same prompt
              </p>
            </div>

            <div className="p-5 bg-slate-900/50 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="flex-1 px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerateImage(regenerateInstructions || undefined)}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logo Editor Modal - uses original image (without logo) for re-editing */}
      {showLogoEditor && logoUrl && hasRealImage && (
        <LogoEditor
          imageUrl={`/images/${post.image_original_filename || post.image_filename}`}
          logoUrl={logoUrl}
          onSave={handleSaveLogoMerge}
          onCancel={() => setShowLogoEditor(false)}
        />
      )}
    </>
  );
}
