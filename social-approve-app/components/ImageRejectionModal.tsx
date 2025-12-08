'use client';

import { useState } from 'react';

interface ImageRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  postTitle: string;
}

export default function ImageRejectionModal({ isOpen, onClose, onSubmit, postTitle }: ImageRejectionModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason);
      setReason('');
    }
  };

  const quickReasons = [
    'Image quality too low',
    'Text not readable',
    'Wrong branding/colors',
    'Image doesn\'t match the content',
    'Layout issues',
    'Need different visual style',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Reject Image</h2>
        <p className="text-sm text-gray-600 mb-4">
          Image for: <span className="font-medium">{postTitle}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason <span className="text-red-500">*</span>
          </label>

          {/* Quick reason buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {quickReasons.map((quickReason) => (
              <button
                key={quickReason}
                type="button"
                onClick={() => setReason(quickReason)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {quickReason}
              </button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why this image should be rejected and what changes are needed..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none text-gray-800"
            rows={4}
            required
          />

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Reject Image
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
