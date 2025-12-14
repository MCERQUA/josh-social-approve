'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Force dynamic rendering to avoid build-time Clerk errors
export const dynamic = 'force-dynamic';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function CCAPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

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

  const modules = [
    {
      id: 'approvals',
      name: 'Post Approvals',
      description: 'Review and approve social media posts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/social/CCA/approvals',
      available: true
    },
    {
      id: 'create',
      name: 'Create Posts',
      description: 'AI-powered social media content creation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      href: '/social/CCA/create',
      available: true
    },
    {
      id: 'schedule',
      name: 'Schedule & Publish',
      description: 'Schedule posts with calendar view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/social/CCA/schedule',
      available: true
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Track performance and engagement',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '#',
      available: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link href="/social" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Brands
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-orange-400">CCA</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">Contractor's Choice Agency</h1>
              <p className="text-slate-400 text-sm mt-0.5">Social Media Management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-white mb-4">Post Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-slate-600 transition-colors">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">Total Posts</p>
              <p className="text-3xl font-semibold text-white">{loading ? '—' : stats.total}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-amber-500/50 transition-colors">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1.5">Pending</p>
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

        {/* Modules */}
        <section>
          <h2 className="text-lg font-medium text-white mb-4">Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((module) => (
              module.available ? (
                <Link key={module.id} href={module.href} className="group block">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-5 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          {module.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-white mb-0.5">{module.name}</h3>
                          <p className="text-sm text-slate-400">{module.description}</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ) : (
                <div key={module.id} className="relative">
                  <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-5 border border-slate-700/30 opacity-60 cursor-not-allowed">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-700/30 border border-slate-600/30 flex items-center justify-center text-slate-500">
                          {module.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-slate-500 mb-0.5">{module.name}</h3>
                          <p className="text-sm text-slate-600">{module.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2">
                    <span className="bg-slate-700/50 text-slate-400 px-2.5 py-1 rounded text-xs font-medium border border-slate-600/50">
                      Coming Soon
                    </span>
                  </div>
                </div>
              )
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
