'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/social/CCA/approvals',
      color: 'from-green-600 to-green-700',
      borderColor: 'border-green-500',
      hoverColor: 'hover:border-green-400',
      available: true
    },
    {
      id: 'create',
      name: 'Create Posts',
      description: 'Create new social media content',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      href: '#',
      color: 'from-blue-600 to-blue-700',
      borderColor: 'border-blue-500',
      hoverColor: 'hover:border-blue-400',
      available: false
    },
    {
      id: 'schedule',
      name: 'Scheduled Posts',
      description: 'View and manage scheduled content',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '#',
      color: 'from-purple-600 to-purple-700',
      borderColor: 'border-purple-500',
      hoverColor: 'hover:border-purple-400',
      available: false
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Track performance and engagement',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '#',
      color: 'from-orange-600 to-orange-700',
      borderColor: 'border-orange-500',
      hoverColor: 'hover:border-orange-400',
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 shadow-2xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Link href="/social" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Brands
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
              <span className="text-2xl font-bold text-white">CCA</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Contractor's Choice Agency</h1>
              <p className="text-slate-400 mt-1 text-lg">Social Media Management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Stats Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Post Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 shadow-lg border border-slate-600">
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Posts</p>
              <p className="text-4xl font-bold text-white">{loading ? '...' : stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6 shadow-lg border border-yellow-500">
              <p className="text-yellow-100 text-sm font-semibold uppercase tracking-wider mb-2">Pending</p>
              <p className="text-4xl font-bold text-white">{loading ? '...' : stats.pending}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-lg border border-green-500">
              <p className="text-green-100 text-sm font-semibold uppercase tracking-wider mb-2">Approved</p>
              <p className="text-4xl font-bold text-white">{loading ? '...' : stats.approved}</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 shadow-lg border border-red-500">
              <p className="text-red-100 text-sm font-semibold uppercase tracking-wider mb-2">Rejected</p>
              <p className="text-4xl font-bold text-white">{loading ? '...' : stats.rejected}</p>
            </div>
          </div>
        </section>

        {/* Modules */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => (
              module.available ? (
                <Link key={module.id} href={module.href} className="group">
                  <div className={`bg-gradient-to-br ${module.color} rounded-2xl p-6 shadow-lg border-2 ${module.borderColor} ${module.hoverColor} hover:shadow-2xl hover:scale-105 transition-all duration-200`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-white">{module.icon}</div>
                      <h3 className="text-2xl font-bold text-white">{module.name}</h3>
                    </div>
                    <p className="text-white/90 mb-4">{module.description}</p>
                    <div className="flex items-center text-white group-hover:text-white/90 transition-colors">
                      <span className="font-semibold">Open module</span>
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ) : (
                <div key={module.id} className="relative">
                  <div className={`bg-gradient-to-br ${module.color} rounded-2xl p-6 shadow-lg border-2 ${module.borderColor} opacity-50 cursor-not-allowed`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-white">{module.icon}</div>
                      <h3 className="text-2xl font-bold text-white">{module.name}</h3>
                    </div>
                    <p className="text-white/90 mb-4">{module.description}</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-slate-900 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg border border-slate-700">
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
