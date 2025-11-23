'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function Home() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 shadow-2xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-5xl font-bold text-white tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Social Media Dashboard
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Manage your social media approvals and content across all brands</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Overview Stats */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 shadow-lg border border-slate-600 hover:shadow-xl hover:border-slate-500 transition-all duration-200">
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Posts</p>
              <p className="text-5xl font-bold text-white">{loading ? '...' : stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6 shadow-lg border border-yellow-500 hover:shadow-xl hover:border-yellow-400 transition-all duration-200">
              <p className="text-yellow-100 text-sm font-semibold uppercase tracking-wider mb-2">Pending Review</p>
              <p className="text-5xl font-bold text-white">{loading ? '...' : stats.pending}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-lg border border-green-500 hover:shadow-xl hover:border-green-400 transition-all duration-200">
              <p className="text-green-100 text-sm font-semibold uppercase tracking-wider mb-2">Approved</p>
              <p className="text-5xl font-bold text-white">{loading ? '...' : stats.approved}</p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 shadow-lg border border-red-500 hover:shadow-xl hover:border-red-400 transition-all duration-200">
              <p className="text-red-100 text-sm font-semibold uppercase tracking-wider mb-2">Rejected</p>
              <p className="text-5xl font-bold text-white">{loading ? '...' : stats.rejected}</p>
            </div>
          </div>
        </section>

        {/* Quick Access */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/social" className="group">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 shadow-lg border border-blue-500 hover:shadow-2xl hover:scale-105 transition-all duration-200">
                <div className="flex items-center gap-4 mb-4">
                  <svg className="w-12 h-12 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-white">Social Media</h3>
                </div>
                <p className="text-blue-100 text-base">Manage social media approvals across all brands</p>
                <div className="mt-6 flex items-center text-blue-100 group-hover:text-white transition-colors">
                  <span className="font-semibold">View all brands</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
