'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface ContentFile {
  id?: string;
  name?: string;
  originalFilename?: string;
  seoFilename?: string;
  path?: string;
  url: string;
  type: 'image' | 'video';
  fileType?: 'image' | 'video';
  category: 'company-images' | 'social-posts' | 'logos' | 'screenshots' | 'uploads' | 'other';
  status?: 'approved' | 'scheduled' | 'pending' | 'untracked';
  size?: number;
  fileSize?: number;
  modified?: string;
  createdAt?: string;
  customerNote?: string | null;
  altText?: string;
  isUntracked?: boolean;
}

interface ContentStats {
  total: number;
  images: number;
  videos: number;
  tracked?: number;
  untracked?: number;
  byCategory: {
    'company-images': number;
    'social-posts': number;
    'logos': number;
    'screenshots': number;
    'uploads'?: number;
    'other': number;
  };
}

interface Brand {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  color: string;
}

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
};

const categoryLabels: Record<string, string> = {
  'company-images': 'Company Photos',
  'social-posts': 'Social Posts',
  'logos': 'Logos',
  'screenshots': 'Screenshots',
  'uploads': 'Uploads',
  'other': 'Other',
};

const categoryIcons: Record<string, React.ReactNode> = {
  'company-images': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'social-posts': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  'logos': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  'screenshots': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  'other': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  'uploads': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ContentLibraryPage() {
  const params = useParams();
  const brandSlug = (params.brand as string)?.toLowerCase();
  const brandPath = `/social/${(params.brand as string)?.toUpperCase()}`;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Preview modal
  const [previewFile, setPreviewFile] = useState<ContentFile | null>(null);

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadNote, setUploadNote] = useState('');
  const [uploadCategory, setUploadCategory] = useState<string>('uploads');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!brandSlug) return;
    try {
      setLoading(true);

      // Fetch brand info
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

      // Fetch content library (with metadata)
      const contentRes = await fetch(`/api/brands/${brandSlug}/library`);
      if (!contentRes.ok) throw new Error('Failed to fetch content');
      const contentData = await contentRes.json();

      // Normalize files to consistent format
      const normalizedFiles = (contentData.files || []).map((f: ContentFile) => ({
        ...f,
        name: f.name || f.seoFilename || f.originalFilename,
        type: f.type || f.fileType,
        size: f.size || f.fileSize,
        modified: f.modified || f.createdAt,
      }));

      setFiles(normalizedFiles);

      // Calculate stats from files
      const calcStats: ContentStats = {
        total: normalizedFiles.length,
        images: normalizedFiles.filter((f: ContentFile) => f.type === 'image').length,
        videos: normalizedFiles.filter((f: ContentFile) => f.type === 'video').length,
        tracked: contentData.stats?.tracked || 0,
        untracked: contentData.stats?.untracked || 0,
        byCategory: {
          'company-images': normalizedFiles.filter((f: ContentFile) => f.category === 'company-images').length,
          'social-posts': normalizedFiles.filter((f: ContentFile) => f.category === 'social-posts').length,
          'logos': normalizedFiles.filter((f: ContentFile) => f.category === 'logos').length,
          'screenshots': normalizedFiles.filter((f: ContentFile) => f.category === 'screenshots').length,
          'uploads': normalizedFiles.filter((f: ContentFile) => f.category === 'uploads').length,
          'other': normalizedFiles.filter((f: ContentFile) => f.category === 'other').length,
        }
      };
      setStats(calcStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [brandSlug]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setUploadError(null);
  };

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('note', uploadNote);
        formData.append('category', uploadCategory);

        const response = await fetch(`/api/brands/${brandSlug}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      // Success - close modal and refresh
      setShowUploadModal(false);
      setSelectedFiles([]);
      setUploadNote('');
      setUploadCategory('uploads');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Reset upload modal
  const resetUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFiles([]);
    setUploadNote('');
    setUploadCategory('uploads');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter files
  const filteredFiles = files.filter((file) => {
    if (categoryFilter !== 'all' && file.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && file.type !== typeFilter) return false;
    if (searchQuery && !(file.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const colors = brand ? (colorMap[brand.color] || colorMap.cyan) : colorMap.cyan;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading content library...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Error</h1>
          <p className="text-slate-400 mb-4">{error || 'Brand not found'}</p>
          <Link href="/social" className="text-cyan-400 hover:text-cyan-300">
            Back to Brands
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href={brandPath} className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {brand.name}
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-6 h-6 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Content Library</h1>
                <p className="text-slate-400 text-sm">Browse all images and videos for {brand.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </button>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total Files</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-2xl font-bold text-cyan-400">{stats.images}</p>
              <p className="text-xs text-slate-400">Images</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-2xl font-bold text-purple-400">{stats.videos}</p>
              <p className="text-xs text-slate-400">Videos</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-2xl font-bold text-emerald-400">{stats.byCategory['company-images']}</p>
              <p className="text-xs text-slate-400">Company Photos</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-2xl font-bold text-amber-400">{stats.byCategory['social-posts']}</p>
              <p className="text-xs text-slate-400">Social Posts</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-2xl font-bold text-blue-400">{stats.byCategory.logos}</p>
              <p className="text-xs text-slate-400">Logos</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Categories</option>
            <option value="uploads">Uploads</option>
            <option value="company-images">Company Photos</option>
            <option value="social-posts">Social Posts</option>
            <option value="logos">Logos</option>
            <option value="screenshots">Screenshots</option>
            <option value="other">Other</option>
          </select>

          {/* Type filter */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(['all', 'image', 'video'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  typeFilter === type
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {type === 'all' ? 'All' : type === 'image' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>

          <span className="text-sm text-slate-400 ml-auto">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* Content Grid */}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-400 text-lg">No content found</p>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload images to the client folder to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => setPreviewFile(file)}
                className="group relative bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800 transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-square relative bg-slate-900">
                  {file.type === 'image' ? (
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                  {/* Category badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      file.category === 'company-images' ? 'bg-emerald-500/20 text-emerald-400' :
                      file.category === 'social-posts' ? 'bg-amber-500/20 text-amber-400' :
                      file.category === 'logos' ? 'bg-blue-500/20 text-blue-400' :
                      file.category === 'screenshots' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {categoryIcons[file.category]}
                    </span>
                  </div>
                  {/* Status badge for social posts */}
                  {file.category === 'social-posts' && file.status && (
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        file.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        file.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {file.status}
                      </span>
                    </div>
                  )}
                </div>
                {/* File info */}
                <div className="p-3">
                  <p className="text-sm text-white truncate" title={file.name}>{file.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(file.size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-slate-900 rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  previewFile.category === 'company-images' ? 'bg-emerald-500/20 text-emerald-400' :
                  previewFile.category === 'social-posts' ? 'bg-amber-500/20 text-amber-400' :
                  previewFile.category === 'logos' ? 'bg-blue-500/20 text-blue-400' :
                  previewFile.category === 'screenshots' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {categoryIcons[previewFile.category]}
                  <span>{categoryLabels[previewFile.category]}</span>
                </span>
                {previewFile.type === 'video' && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                    Video
                  </span>
                )}
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex items-center justify-center bg-slate-950/50 max-h-[60vh] overflow-auto">
              {previewFile.type === 'image' ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-[55vh] object-contain"
                />
              ) : (
                <video
                  src={previewFile.url}
                  controls
                  className="max-w-full max-h-[55vh]"
                />
              )}
            </div>

            {/* File details */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{previewFile.name}</p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {formatFileSize(previewFile.size)} &bull; Modified {formatDate(previewFile.modified)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={resetUploadModal}
        >
          <div
            className="bg-slate-900 rounded-xl max-w-lg w-full overflow-hidden border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Upload Content</h2>
                  <p className="text-sm text-slate-400">Add images or videos to {brand?.name}</p>
                </div>
              </div>
              <button
                onClick={resetUploadModal}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-5">
              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Files
                </label>
                <div
                  className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFiles.length === 0 ? (
                    <>
                      <svg className="w-10 h-10 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-400 mb-1">Click to select files</p>
                      <p className="text-sm text-slate-500">PNG, JPG, GIF, WEBP, MP4, MOV up to 50MB</p>
                    </>
                  ) : (
                    <div className="text-left">
                      <p className="text-cyan-400 font-medium mb-2">{selectedFiles.length} file(s) selected:</p>
                      <ul className="text-sm text-slate-400 space-y-1 max-h-32 overflow-y-auto">
                        {selectedFiles.map((f, i) => (
                          <li key={i} className="truncate">
                            {f.name} ({formatFileSize(f.size)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Note field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description / Note <span className="text-slate-500">(used for SEO filename)</span>
                </label>
                <textarea
                  value={uploadNote}
                  onChange={(e) => setUploadNote(e.target.value)}
                  placeholder="Example: Spray foam installation in Phoenix attic - crew working on residential project"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  This description helps us name the file properly for search engines and helps you find it later.
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="uploads">Uploads (Default)</option>
                  <option value="company-images">Company Photos</option>
                  <option value="logos">Logos</option>
                  <option value="screenshots">Screenshots</option>
                </select>
              </div>

              {/* Error message */}
              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {uploadError}
                </div>
              )}

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Uploading...</span>
                    <span className="text-cyan-400">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700 bg-slate-800/50">
              <button
                onClick={resetUploadModal}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
