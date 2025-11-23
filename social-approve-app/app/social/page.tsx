'use client';

import Link from 'next/link';

export default function SocialPage() {
  // In the future, this will fetch from a database of registered companies
  const companies = [
    {
      id: 'CCA',
      name: "Contractor's Choice Agency",
      shortName: 'CCA',
      description: 'Insurance services for contractors',
      color: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-400',
      hoverColor: 'hover:border-orange-300'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 shadow-2xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-5xl font-bold text-white tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Social Media Brands
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Select a brand to manage social media content</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Link key={company.id} href={`/social/${company.id}`} className="group">
              <div className={`bg-gradient-to-br ${company.color} rounded-2xl p-8 shadow-lg border-2 ${company.borderColor} ${company.hoverColor} hover:shadow-2xl hover:scale-105 transition-all duration-200`}>
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-6 mx-auto">
                  <span className="text-3xl font-bold text-white">{company.shortName}</span>
                </div>
                <h3 className="text-2xl font-bold text-white text-center mb-3">{company.name}</h3>
                <p className="text-white/90 text-center mb-6">{company.description}</p>
                <div className="flex items-center justify-center text-white group-hover:text-white/90 transition-colors">
                  <span className="font-semibold">Manage content</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State (for future when adding more companies) */}
        {companies.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto text-slate-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-2xl font-bold text-slate-400 mb-2">No brands registered yet</h3>
            <p className="text-slate-500">Add your first brand to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}
