'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopicalMapViewer } from '@/components/website-content/topical-map-viewer';
import { ArticleQueueViewer } from '@/components/website-content/article-queue-viewer';
import { BlogsHub } from '@/components/website-hub/blogs-hub';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// VPS API for content data (filesystem access)
const VPS_API_URL = process.env.NEXT_PUBLIC_VPS_API_URL || 'http://5.161.252.203:6350';

interface WebsiteContent {
  website: {
    id: number;
    name: string;
    url: string;
    domain_folder: string;
    slug?: string; // Used for URL routing
  };
  topicalMap: {
    metadata: Record<string, unknown>;
    pillars: Pillar[];
  } | null;
  articleQueue: QueueArticle[];
  stats: {
    total_pillars: number;
    total_articles: number;
    planned: number;
    researching: number;
    published: number;
    in_queue: number;
  };
  hasContent: boolean;
}

interface Pillar {
  id: string;
  title: string;
  primaryKeyword?: string;
  priority?: string;
  status?: string;
  supportingArticles?: Article[];
}

interface Article {
  id: string;
  title: string;
  keyword?: string;
  status?: string;
  estimatedWordCount?: number;
}

interface QueueArticle {
  id: string;
  title: string;
  slug: string;
  target_keyword: string;
  cluster: string;
  cluster_priority: 'high' | 'medium' | 'low';
  status: string;
  order: number;
  estimated_hours: number;
}

type TabType = 'overview' | 'blog-management' | 'queue' | 'topical-map';

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const websiteId = params.id as string;

  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    fetchContent();
  }, [websiteId]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/websites/${websiteId}/content`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch content');
      }

      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading website content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Content</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/websites')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Back to Websites
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      id: 'blog-management',
      label: 'Blog Management',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
    {
      id: 'queue',
      label: 'Blog Queue',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      id: 'topical-map',
      label: 'Topical Map',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/websites')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-white">{content.website.name}</h1>
                  <a
                    href={content.website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 text-sm hover:text-teal-400 transition-colors flex items-center gap-1"
                  >
                    {content.website.url.replace(/^https?:\/\//, '')}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Content Status Badge */}
            {content.hasContent ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-sm text-emerald-400">Content Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-sm text-amber-400">No Content Yet</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white border-b-2 border-teal-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'queue' && content.stats.in_queue > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-teal-500/20 text-teal-400 rounded">
                    {content.stats.in_queue}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Content Pillars"
                value={content.stats.total_pillars}
                color="teal"
              />
              <StatCard
                label="Total Articles"
                value={content.stats.total_articles}
                color="blue"
              />
              <StatCard
                label="In Queue"
                value={content.stats.in_queue}
                color="amber"
              />
              <StatCard
                label="Published"
                value={content.stats.published}
                color="emerald"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('queue')}
                className="flex items-center gap-4 p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-teal-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-medium text-white">View Blog Queue</h3>
                  <p className="text-slate-400 text-sm">{content.stats.in_queue} articles waiting to be written</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 ml-auto group-hover:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => setActiveTab('topical-map')}
                className="flex items-center gap-4 p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-teal-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-medium text-white">View Topical Map</h3>
                  <p className="text-slate-400 text-sm">{content.stats.total_pillars} content pillars mapped</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 ml-auto group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* No Content Message */}
            {!content.hasContent && (
              <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">Content Strategy in Progress</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Your website content strategy is being developed. Once the topical map and article queue are ready, you&apos;ll see them here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'blog-management' && (
          <BlogsHub domain={content.website.domain_folder} />
        )}

        {activeTab === 'queue' && (
          <ArticleQueueViewer articles={content.articleQueue} />
        )}

        {activeTab === 'topical-map' && (
          <TopicalMapViewer
            pillars={content.topicalMap?.pillars || []}
            metadata={content.topicalMap?.metadata || {}}
          />
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}
