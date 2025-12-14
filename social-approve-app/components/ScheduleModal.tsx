'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PostWithApproval, OneUpCategory, OneUpAccount } from '@/types';

interface ScheduleModalProps {
  isOpen: boolean;
  post: PostWithApproval | null;
  onClose: () => void;
  onSchedule: (postId: number, scheduledFor: string, categoryId: number, platforms: string[]) => Promise<void>;
}

export default function ScheduleModal({
  isOpen,
  post,
  onClose,
  onSchedule,
}: ScheduleModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [categories, setCategories] = useState<OneUpCategory[]>([]);
  const [accounts, setAccounts] = useState<OneUpAccount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [oneUpConfigured, setOneUpConfigured] = useState(true);

  // Set default date to tomorrow
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Fetch OneUp categories
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Fetch accounts when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchAccounts(selectedCategory);
    } else {
      setAccounts([]);
      setSelectedPlatforms([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/oneup/categories');
      const data = await response.json();

      if (!data.configured) {
        setOneUpConfigured(false);
        return;
      }

      setCategories(data.categories || []);
      setOneUpConfigured(true);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchAccounts = async (categoryId: number) => {
    setLoadingAccounts(true);
    try {
      const response = await fetch(`/api/oneup/accounts?category_id=${categoryId}`);
      const data = await response.json();
      setAccounts(data.accounts || []);
      // Default to ALL platforms
      setSelectedPlatforms(['ALL']);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!post || !scheduledDate || !scheduledTime) return;

    setLoading(true);
    try {
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      await onSchedule(
        post.id,
        scheduledFor,
        selectedCategory || 0,
        selectedPlatforms.includes('ALL') ? ['ALL'] : selectedPlatforms
      );
      onClose();
    } catch (error) {
      console.error('Error scheduling post:', error);
      alert('Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    if (platformId === 'ALL') {
      setSelectedPlatforms(['ALL']);
    } else {
      setSelectedPlatforms((prev) => {
        const filtered = prev.filter((p) => p !== 'ALL');
        if (filtered.includes(platformId)) {
          return filtered.filter((p) => p !== platformId);
        } else {
          return [...filtered, platformId];
        }
      });
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Schedule Post</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5">
          {/* Post Preview */}
          <div className="flex gap-4 mb-6 p-4 bg-slate-700/50 rounded-lg">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={`/images/${post.image_filename}`}
                alt={post.title}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white mb-1 truncate">{post.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2">{post.content}</p>
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                  post.platform === 'facebook'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {post.platform === 'facebook' ? 'Facebook' : 'Google Business'}
              </span>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Schedule Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Schedule Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* OneUp Integration */}
          {oneUpConfigured ? (
            <>
              {/* Category Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  OneUp Category (Optional)
                </label>
                {loadingCategories ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    Loading categories...
                  </div>
                ) : (
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category (for auto-publish)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Platform Selection */}
              {selectedCategory && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Target Platforms
                  </label>
                  {loadingAccounts ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      Loading accounts...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* All Platforms Option */}
                      <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes('ALL')}
                          onChange={() => togglePlatform('ALL')}
                          className="w-4 h-4 rounded border-slate-500 bg-slate-600 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-white font-medium">All Platforms</span>
                        <span className="text-slate-400 text-sm">Post to all connected accounts</span>
                      </label>

                      {/* Individual Platforms */}
                      {accounts.map((account) => (
                        <label
                          key={account.social_network_id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedPlatforms.includes('ALL')
                              ? 'bg-slate-800/50 opacity-50'
                              : 'bg-slate-700/50 hover:bg-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedPlatforms.includes('ALL') ||
                              selectedPlatforms.includes(account.social_network_id)
                            }
                            onChange={() => togglePlatform(account.social_network_id)}
                            disabled={selectedPlatforms.includes('ALL')}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-600 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white">{account.social_network_name}</span>
                          <span className="text-slate-400 text-xs px-2 py-0.5 bg-slate-600 rounded">
                            {account.social_network_type}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="text-amber-400 font-medium">OneUp Not Configured</h4>
                  <p className="text-slate-400 text-sm mt-1">
                    Add ONEUP_API_KEY to your environment to enable auto-publishing to social media platforms.
                    For now, posts will be scheduled locally only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !scheduledDate || !scheduledTime}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
