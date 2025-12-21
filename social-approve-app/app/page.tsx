'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useTenant } from '@/lib/tenant-context';

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

  const displayName = user?.firstName || user?.username || 'User';
  const primaryBrand = brands.length > 0 ? brands[0] : null;
  const primaryWebsite = websites.find(w => w.is_primary) || (websites.length > 0 ? websites[0] : null);

  // Show management section for users with multiple brands or many websites
  const showManagement = brands.length > 3 || websites.length > 6;
  const showBrandsSection = brands.length > 1;
  const showWebsitesSection = websites.length > 0;

  useEffect(() => {
    fetchStats();
    fetchWebsites();
    fetchWebsiteStats();
  }, []);

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      if (response.ok) {
        const data = await response.json();
        setWebsites(data);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setWebsiteLoading(false);
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
      // Don't set hardcoded fallback - use zeros
      setWebsiteStats({ totalLive: 0, dotCom: 0, netlify: 0, wordpress: 0 });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-white mb-1">
            {displayName}&apos;s Dashboard
          </h1>
          <p className="text-slate-400 text-sm">Manage your content, websites, and social media</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: QUICK ACTIONS
            Always visible, links to primary brand actions
        ═══════════════════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Approvals */}
            <Link
              href={primaryBrand ? `/social/${primaryBrand.slug.toUpperCase()}/approvals` : '/social'}
              className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-800/70 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-medium text-sm">Approvals</h3>
                  <p className="text-xs text-slate-500 truncate">
                    {loading ? '...' : `${stats.pending} pending`}
                  </p>
                </div>
              </div>
            </Link>

            {/* Create Post */}
            <Link
              href={primaryBrand ? `/social/${primaryBrand.slug.toUpperCase()}/create` : '/social'}
              className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-medium text-sm">Create Post</h3>
                  <p className="text-xs text-slate-500 truncate">New content</p>
                </div>
              </div>
            </Link>

            {/* Schedule */}
            <Link
              href={primaryBrand ? `/social/${primaryBrand.slug.toUpperCase()}/schedule` : '/social'}
              className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/70 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-medium text-sm">Schedule</h3>
                  <p className="text-xs text-slate-500 truncate">Calendar view</p>
                </div>
              </div>
            </Link>

            {/* Blog/Content */}
            <Link
              href={primaryWebsite?.domain_folder ? `/websites/${primaryWebsite.domain_folder}` : '/websites'}
              className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-teal-500/50 hover:bg-slate-800/70 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-medium text-sm">Blog Content</h3>
                  <p className="text-xs text-slate-500 truncate">Articles & topics</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: OVERVIEW (Stats) - Compact inline badges
        ═══════════════════════════════════════════════════════════════ */}
        <section className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider mr-2">Stats:</span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs">
            <span className="text-slate-400">Posts</span>
            <span className="font-semibold text-white">{loading ? '—' : stats.total}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs">
            <span className="text-amber-400/70">Pending</span>
            <span className="font-semibold text-amber-400">{loading ? '—' : stats.pending}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="text-emerald-400/70">Approved</span>
            <span className="font-semibold text-emerald-400">{loading ? '—' : stats.approved}</span>
          </span>

          {stats.rejected > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs">
              <span className="text-rose-400/70">Rejected</span>
              <span className="font-semibold text-rose-400">{stats.rejected}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs">
            <span className="text-teal-400/70">Sites</span>
            <span className="font-semibold text-teal-400">{websiteLoading ? '—' : websiteStats.totalLive}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs">
            <span className="text-blue-400/70">Brands</span>
            <span className="font-semibold text-blue-400">{brands.length}</span>
          </span>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: YOUR BRANDS
            Shows brand cards (only if multiple brands)
        ═══════════════════════════════════════════════════════════════ */}
        {showBrandsSection && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Your Brands</h2>
              {brands.length > 4 && (
                <Link href="/social" className="text-xs text-slate-500 hover:text-white transition-colors">
                  View all {brands.length} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {brands.slice(0, 4).map((brand, index) => (
                <Link
                  key={brand.slug}
                  href={`/social/${brand.slug.toUpperCase()}`}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/70 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      index === 0
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'bg-slate-600/20 border border-slate-600/30'
                    }`}>
                      <span className={`text-sm font-semibold ${index === 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                        {(brand.short_name || brand.slug.toUpperCase()).slice(0, 3)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-medium text-sm truncate">{brand.name}</h3>
                      <p className="text-xs text-slate-500">
                        {index === 0 ? 'Primary' : 'Brand'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Show "+X more" card if many brands */}
              {brands.length > 4 && (
                <Link
                  href="/social"
                  className="group bg-slate-800/30 rounded-lg p-4 border border-slate-700/30 hover:border-slate-600 hover:bg-slate-800/50 transition-all flex items-center justify-center"
                >
                  <div className="text-center">
                    <span className="text-lg font-semibold text-slate-400">+{brands.length - 4}</span>
                    <p className="text-xs text-slate-500">more brands</p>
                  </div>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: YOUR WEBSITES
            Shows website cards with content status
        ═══════════════════════════════════════════════════════════════ */}
        {showWebsitesSection && !websiteLoading && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Your Websites</h2>
              {websites.length > 6 && (
                <Link href="/websites" className="text-xs text-slate-500 hover:text-white transition-colors">
                  View all {websites.length} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {websites.slice(0, 6).map((website, index) => (
                <Link
                  key={website.id}
                  href={website.domain_folder ? `/websites/${website.domain_folder}` : `/websites/${website.id}`}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-teal-500/50 hover:bg-slate-800/70 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      website.is_primary || index === 0
                        ? 'bg-teal-500/10 border border-teal-500/20'
                        : 'bg-slate-600/20 border border-slate-600/30'
                    }`}>
                      <svg className={`w-5 h-5 ${website.is_primary || index === 0 ? 'text-teal-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-medium text-sm truncate">{website.name}</h3>
                      <p className="text-xs text-slate-500 truncate">
                        {website.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </p>
                    </div>
                    {website.domain_folder && (
                      <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Connected
                      </span>
                    )}
                  </div>
                </Link>
              ))}

              {/* Show "+X more" card if many websites */}
              {websites.length > 6 && (
                <Link
                  href="/websites"
                  className="group bg-slate-800/30 rounded-lg p-4 border border-slate-700/30 hover:border-slate-600 hover:bg-slate-800/50 transition-all flex items-center justify-center"
                >
                  <div className="text-center">
                    <span className="text-lg font-semibold text-slate-400">+{websites.length - 6}</span>
                    <p className="text-xs text-slate-500">more sites</p>
                  </div>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5: MANAGEMENT
            Full navigation links for large clients
        ═══════════════════════════════════════════════════════════════ */}
        {showManagement && (
          <section>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Management</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/social" className="group block">
                <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30 hover:border-blue-500/30 hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">All Social Brands</h3>
                        <p className="text-sm text-slate-500">{brands.length} brands connected</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>

              <Link href="/websites" className="group block">
                <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30 hover:border-teal-500/30 hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">All Websites</h3>
                        <p className="text-sm text-slate-500">{websiteStats.totalLive} sites managed</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
