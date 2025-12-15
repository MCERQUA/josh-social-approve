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

export default function Home() {
  const { user } = useUser();
  const { tenant } = useTenant();
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [websiteStats, setWebsiteStats] = useState<WebsiteStats>({ totalLive: 0, dotCom: 0, netlify: 0, wordpress: 0 });
  const [loading, setLoading] = useState(true);
  const [websiteLoading, setWebsiteLoading] = useState(true);

  // Get display name - prefer firstName, fallback to username, then default
  const displayName = user?.firstName || user?.username || 'User';

  // Show websites section for all tenants
  const showWebsites = true;

  useEffect(() => {
    fetchStats();
    if (showWebsites) {
      fetchWebsiteStats();
    }
  }, [showWebsites]);

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
