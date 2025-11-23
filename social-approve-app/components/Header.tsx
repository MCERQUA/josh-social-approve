'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

export default function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isSignedIn } = useUser();
  const { signOut, openSignIn } = useClerk();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            Social Dashboard
          </span>
        </Link>

        {/* User Menu */}
        {isSignedIn ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.fullName || user?.username}</p>
                <p className="text-xs text-slate-400">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || 'User'}
                  className="w-9 h-9 rounded-full object-cover shadow-lg shadow-orange-500/20"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-sm font-semibold text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              )}
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl shadow-black/20 z-50 py-2">
                  {/* User Info (Mobile) */}
                  <div className="px-4 py-3 border-b border-slate-700/50 sm:hidden">
                    <p className="text-sm font-medium text-white">{user?.fullName || user?.username}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                    <Link
                      href="/social"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Social Media
                    </Link>
                  </div>

                  <div className="border-t border-slate-700/50 my-1"></div>

                  <div className="py-1">
                    <button
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors w-full text-left"
                      onClick={async () => {
                        await signOut();
                        setUserMenuOpen(false);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
            onClick={() => openSignIn()}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
