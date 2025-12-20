'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useTenant } from '@/lib/tenant-context';

// Force dynamic rendering to avoid build-time Clerk errors
export const dynamic = 'force-dynamic';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface WebsiteStats {
  totalLive: number;
  dotCom: number;
  netlify: number;
  wordpress: number;
}

interface Website {
  id: number;
  name: string;
  url: string;
  platform: string;
  domain_folder: string | null;
  is_primary: boolean;
}

export default function Home() {
  const { user } = useUser();
  const { tenant, brands } = useTenant();
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [websiteStats, setWebsiteStats] = useState<WebsiteStats>({ totalLive: 0, dotCom: 0, netlify: 0, wordpress: 0 });
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [websiteLoading, setWebsiteLoading] = useState(true);

  // Get display name - prefer firstName, fallback to username, then default
  const displayName = user?.firstName || user?.username || 'User';

  // Show websites section for all tenants
  const showWebsites = true;

  // Determine if this is a small client (1 brand + 1 website or less)
  const isSmallClient = brands.length <= 1 && websites.length <= 1;
  const primaryBrand = brands.length > 0 ? brands[0] : null;
  const primaryWebsite = websites.find(w => w.is_primary) || (websites.length > 0 ? websites[0] : null);

  useEffect(() => {
    fetchStats();
    fetchWebsites();
    if (showWebsites) {
      fetchWebsiteStats();
    }
  }, [showWebsites]);

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      if (response.ok) {
        const data = await response.json();
        setWebsites(data);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const posts = await response.json();

      setStats({
        total: posts.length,
        pending: posts.filter((p: any) => p.approval?.status === 'pending').length,
        approved: posts.filter((p: any) => p.approval?.status === 'approved').length,
        rejected: posts.filter((p: any) => p.approval?.status === 'rejected').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebsiteStats = async () => {
    try {
      const response = await fetch('/api/websites/stats');
      if (!response.ok) throw new Error('Failed to fetch website stats');
      const data = await response.json();
      setWebsiteStats(data);
    } catch (error) {
      console.error('Error fetching website stats:', error);
      // Set fallback stats if API fails
      setWebsiteStats({ totalLive: 133, dotCom: 93, netlify: 92, wordpress: 41 });
    } finally {
      setWebsiteLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            {displayName}&apos;s Dashboard
          </h1>
          <p className="text-slate-400 text-sm">Manage your content, websites, and social media across all brands</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Social Media Stats */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-white mb-4">Social Media</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-slate-600 transition-colors">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">Total Posts</p>
              <p className="text-3xl font-semibold text-white">{loading ? '—' : stats.total}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-amber-500/50 transition-colors">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">Pending Review</p>
              <p className="text-3xl font-semibold text-amber-400">{loading ? '—' : stats.pending}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-emerald-500/50 transition-colors">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">Approved</p>
              <p className="text-3xl font-semibold text-emerald-400">{loading ? '—' : stats.approved}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-rose-500/50 transition-colors">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">Rejected</p>
              <p className="text-3xl font-semibold text-rose-400">{loading ? '—' : stats.rejected}</p>
            </div>
          </div>
        </section>

        {/* Websites Stats - Only show for tenants with websites */}
        {showWebsites && (
          <section className="mb-10">
            <h2 className="text-lg font-medium text-white mb-4">Websites</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-teal-500/50 transition-colors">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">All Sites</p>
                <p className="text-3xl font-semibold text-teal-400">{websiteLoading ? '—' : websiteStats.totalLive}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-blue-500/50 transition-colors">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">.com Domains</p>
                <p className="text-3xl font-semibold text-blue-400">{websiteLoading ? '—' : websiteStats.dotCom}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-cyan-500/50 transition-colors">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">Netlify Sites</p>
                <p className="text-3xl font-semibold text-cyan-400">{websiteLoading ? '—' : websiteStats.netlify}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-orange-500/50 transition-colors">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">WordPress Sites</p>
                <p className="text-3xl font-semibold text-orange-400">{websiteLoading ? '—' : websiteStats.wordpress}</p>
              </div>
            </div>
          </section>
        )}

        {/* Shortcuts - Adaptive based on client size */}
        {(primaryBrand || primaryWebsite) && (
          <section className="mb-10">
            <h2 className="text-lg font-medium text-white mb-4">
              {isSmallClient ? 'Your Shortcuts' : 'Main Connections'}
            </h2>

            {/* Small Client: Direct access to brand features */}
            {isSmallClient && primaryBrand && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Social Approvals */}
                <Link
                  href={`/social/${primaryBrand.slug.toUpperCase()}/approvals`}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-800/70 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Approvals</h3>
                      <p className="text-xs text-slate-400">Review pending posts</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 group-hover:text-amber-400 transition-colors">
                    <span>View</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Create Post */}
                <Link
                  href={`/social/${primaryBrand.slug.toUpperCase()}/create`}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Create Post</h3>
                      <p className="text-xs text-slate-400">New social content</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 group-hover:text-emerald-400 transition-colors">
                    <span>Create</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Schedule */}
                <Link
                  href={`/social/${primaryBrand.slug.toUpperCase()}/schedule`}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/70 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Schedule</h3>
                      <p className="text-xs text-slate-400">View calendar</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 group-hover:text-blue-400 transition-colors">
                    <span>View</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* Website Content - if connected */}
                {primaryWebsite && primaryWebsite.domain_folder && (
                  <Link
                    href={`/websites/${primaryWebsite.domain_folder}`}
                    className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-teal-500/50 hover:bg-slate-800/70 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Blog Content</h3>
                        <p className="text-xs text-slate-400">Topical map & queue</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 group-hover:text-teal-400 transition-colors">
                      <span>Manage</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )}

                {/* Website Content - not connected, show setup */}
                {primaryWebsite && !primaryWebsite.domain_folder && (
                  <Link
                    href={`/websites`}
                    className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-slate-500/50 hover:bg-slate-800/70 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Website</h3>
                        <p className="text-xs text-slate-400">Connect content</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 group-hover:text-slate-300 transition-colors">
                      <span>Setup</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )}
              </div>
            )}

            {/* Large Client: Show main brand cards */}
            {!isSmallClient && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Primary Brand */}
                {primaryBrand && (
                  <Link
                    href={`/social/${primaryBrand.slug.toUpperCase()}`}
                    className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/70 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-400">
                          {(primaryBrand.short_name || primaryBrand.slug.toUpperCase()).slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{primaryBrand.name}</h3>
                        <p className="text-xs text-slate-400">Primary brand</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 group-hover:text-blue-400 transition-colors">
                      <span>Manage social</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )}

                {/* Primary Website */}
                {primaryWebsite && (
                  <Link
                    href={`/websites/${primaryWebsite.domain_folder || primaryWebsite.id}`}
                    className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-teal-500/50 hover:bg-slate-800/70 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{primaryWebsite.name}</h3>
                        <p className="text-xs text-slate-400 truncate">{primaryWebsite.url.replace(/^https?:\/\//, '')}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 group-hover:text-teal-400 transition-colors">
                      <span>{primaryWebsite.domain_folder ? 'Manage content' : 'Setup content'}</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )}

                {/* Show additional brands count */}
                {brands.length > 1 && (
                  <Link
                    href="/social"
                    className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-slate-500/50 hover:bg-slate-800/70 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                        <span className="text-lg font-semibold text-slate-400">+{brands.length - 1}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">More Brands</h3>
                        <p className="text-xs text-slate-400">{brands.length - 1} additional brand{brands.length > 2 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 group-hover:text-slate-300 transition-colors">
                      <span>View all</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </section>
        )}

        {/* Quick Access */}
        <section>
          <h2 className="text-lg font-medium text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Social Media */}
            <Link href="/social" className="group block">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/70 transition-all h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white mb-0.5">Social Media</h3>
                      <p className="text-sm text-slate-400">Manage approvals across all brands</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Websites - Only show for tenants with websites */}
            {showWebsites && (
              <Link href="/websites" className="group block">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 hover:border-teal-500/50 hover:bg-slate-800/70 transition-all h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white mb-0.5">Websites</h3>
                        <p className="text-sm text-slate-400">Manage and monitor your websites</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
