'use client';

// Force dynamic rendering to avoid build-time Clerk errors
export const dynamic = 'force-dynamic';

export default function WebsitesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Page Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Websites</h1>
              <p className="text-slate-400 text-sm">Manage and monitor your websites</p>
            </div>
          </div>
        </div>
      </header>

      {/* Embedded Website */}
      <div className="flex-1">
        <iframe
          src="https://josh-netlify.netlify.app/"
          className="w-full h-full min-h-[calc(100vh-180px)] border-0"
          title="Websites Dashboard"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
