'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';

// Force dynamic rendering to avoid build-time Clerk errors
export const dynamic = 'force-dynamic';

interface Website {
  id: number;
  tenant_id: number;
  name: string;
  url: string;
  platform: string;
  description: string | null;
  domain_folder: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  screenshot_url: string | null;
}

interface AvailableFolder {
  folder: string;
  label: string;
  hasTopicalMap?: boolean;
}

export default function WebsitesPage() {
  const { tenant } = useTenant();
  const router = useRouter();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebsite, setNewWebsite] = useState({ name: '', url: '', platform: 'custom', description: '', domain_folder: '' });
  const [saving, setSaving] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<AvailableFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // For Josh, show the iframe to his Netlify dashboard
  const isJosh = tenant?.subdomain === 'josh';

  useEffect(() => {
    if (!isJosh) {
      fetchWebsites();
    } else {
      setLoading(false);
    }
  }, [isJosh]);

  useEffect(() => {
    if (showAddForm && availableFolders.length === 0) {
      fetchAvailableFolders();
    }
  }, [showAddForm]);

  const fetchAvailableFolders = async () => {
    setLoadingFolders(true);
    try {
      const response = await fetch('/api/websites/available-folders');
      if (response.ok) {
        const data = await response.json();
        setAvailableFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      if (!response.ok) throw new Error('Failed to fetch websites');
      const data = await response.json();
      setWebsites(data);
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebsite)
      });

      if (!response.ok) throw new Error('Failed to add website');

      const website = await response.json();
      setWebsites([...websites, website]);
      setNewWebsite({ name: '', url: '', platform: 'custom', description: '', domain_folder: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding website:', error);
      alert('Failed to add website');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebsite = async (id: number) => {
    if (!confirm('Are you sure you want to remove this website?')) return;

    try {
      const response = await fetch(`/api/websites?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete website');
      setWebsites(websites.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting website:', error);
      alert('Failed to remove website');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'netlify':
        return (
          <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 0 1 .209.574l3.497 1.482a1.044 1.044 0 0 1 .605-.354l.502-3.011-3.17-3.145-1.643 4.454zM18.853 9.727l.996-.443a.545.545 0 0 0 .303-.666l-.332-.77-1.497.665.53 1.214zM10.926 8.242l-5.528 2.449.12.49 5.478-2.428a1.26 1.26 0 0 1-.07-.511zM9.25 6.847a1.27 1.27 0 0 1-.165.779l3.32 3.2 5.453-2.419-3.544-1.5a1.044 1.044 0 0 1-.77.282 1.044 1.044 0 0 1-.209-.045l-4.085 1.543zM6.014 5.313L4.02 7.28l3.227 1.377.02-.069a1.27 1.27 0 0 1 1.185-.808h.026L8.46 7.79l-2.447-2.477zM18.391 11.51l-5.39 2.393.092.341 5.68-2.52-.382-.214zM17.802 12.66l-5.594 2.483.09.334 5.836-2.59a4.615 4.615 0 0 1-.332-.227zM17.049 13.38l-5.68 2.52c.003.002.005.005.007.008l5.703-2.53a.644.644 0 0 1-.03-.098zM6.06 4.37L5.033 5.4l2.447 2.477a1.27 1.27 0 0 1 .638-.17h.008c.133.003.28.03.408.081l.009-.024L6.059 4.37zM18.353 11.018l-.012-.007-5.454 2.42.092.339 5.625-2.495-.251-.257zM9.455 12.652l-1.9 5.138 1.91-5.166a1.236 1.236 0 0 1-.01-.028zM9.127 9.77a1.27 1.27 0 0 1-.142.097l-.029.078.04-.04 5.58 5.386 1.127-.5-6.576-5.021z"/>
          </svg>
        );
      case 'wordpress':
        return (
          <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.158 12.786l-2.698 7.84c.806.236 1.657.365 2.54.365 1.047 0 2.051-.18 2.986-.511a.845.845 0 0 1-.069-.165l-2.759-7.529zm-9.583-.066c0 2.907 1.685 5.422 4.128 6.626l-3.49-9.563a8.973 8.973 0 0 0-.638 2.937zm13.07-.226c0-.909-.327-1.54-.606-2.03-.373-.606-.723-1.12-.723-1.724 0-.676.512-1.305 1.235-1.305.033 0 .064.004.095.006a8.995 8.995 0 0 0-5.647-2.008c-2.927 0-5.503 1.416-7.115 3.599.2.006.388.01.548.01.89 0 2.27-.108 2.27-.108.459-.027.513.647.054.701 0 0-.461.054-.975.081l3.1 9.217 1.862-5.582-1.326-3.635c-.459-.027-.894-.081-.894-.081-.459-.027-.405-.728.054-.701 0 0 1.407.108 2.243.108.89 0 2.27-.108 2.27-.108.459-.027.513.647.054.701 0 0-.462.054-.975.081l3.073 9.14.848-2.835c.368-.938.594-1.613.594-2.196zm7.217-.154c0 4.907-3.983 8.89-8.89 8.89s-8.89-3.983-8.89-8.89 3.983-8.89 8.89-8.89 8.89 3.983 8.89 8.89zm-.456 0c0-4.656-3.779-8.434-8.434-8.434s-8.434 3.779-8.434 8.434 3.779 8.434 8.434 8.434 8.434-3.779 8.434-8.434zm-5.068-6.31c.032.236.05.49.05.757 0 .746-.14 1.586-.56 2.633l-2.247 6.497c2.186-1.274 3.657-3.654 3.657-6.375 0-1.272-.325-2.469-.9-3.512z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
    }
  };

  // For Josh, show the iframe
  if (isJosh) {
    return (
      <div className="min-h-screen flex flex-col">
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

  // For other tenants, show website list
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Websites</h1>
                <p className="text-slate-400 text-sm">Manage your websites</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Website
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Add Website Form */}
        {showAddForm && (
          <div className="mb-8 bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-lg font-medium text-white mb-4">Add Website</h2>
            <form onSubmit={handleAddWebsite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Website Name</label>
                  <input
                    type="text"
                    value={newWebsite.name}
                    onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                    placeholder="My Business Website"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">URL</label>
                  <input
                    type="url"
                    value={newWebsite.url}
                    onChange={(e) => setNewWebsite({ ...newWebsite, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Platform</label>
                  <select
                    value={newWebsite.platform}
                    onChange={(e) => setNewWebsite({ ...newWebsite, platform: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="custom">Custom / Other</option>
                    <option value="wordpress">WordPress</option>
                    <option value="netlify">Netlify</option>
                    <option value="squarespace">Squarespace</option>
                    <option value="wix">Wix</option>
                    <option value="shopify">Shopify</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={newWebsite.description}
                    onChange={(e) => setNewWebsite({ ...newWebsite, description: e.target.value })}
                    placeholder="Main company website"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Content Integration Section */}
              <div className="border-t border-slate-700/50 pt-4 mt-4">
                <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Content Integration (optional)
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Connect to Content Source</label>
                  <select
                    value={newWebsite.domain_folder}
                    onChange={(e) => setNewWebsite({ ...newWebsite, domain_folder: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                    disabled={loadingFolders}
                  >
                    <option value="">No content integration</option>
                    {loadingFolders ? (
                      <option disabled>Loading available sources...</option>
                    ) : (
                      availableFolders.map(folder => (
                        <option key={folder.folder} value={folder.folder}>
                          {folder.label}{folder.hasTopicalMap ? ' ✓' : ' (setup needed)'}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Connect to an existing content source to view blog queue and topical maps
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Website'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Websites List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading websites...</p>
          </div>
        ) : websites.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <svg className="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No websites yet</h3>
            <p className="text-slate-400 mb-4">Add your first website to start tracking</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Website
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => (
              <div
                key={website.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-teal-500/50 transition-all hover:shadow-lg hover:shadow-teal-500/10"
              >
                {/* Screenshot Preview */}
                <a
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-video bg-slate-900/50 overflow-hidden group"
                >
                  {website.screenshot_url ? (
                    <img
                      src={website.screenshot_url}
                      alt={`${website.name} preview`}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        Visit Site
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </a>

                {/* Website Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                        {getPlatformIcon(website.platform)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-medium truncate">{website.name}</h3>
                        <p className="text-slate-400 text-xs truncate">{website.url.replace(/^https?:\/\//, '')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteWebsite(website.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Remove website"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {website.domain_folder && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Content Connected
                      </div>
                    </div>
                  )}
                  {website.description && (
                    <p className="text-slate-400 text-sm line-clamp-2 mb-3">{website.description}</p>
                  )}
                  {/* Manage Content Button */}
                  <button
                    onClick={() => router.push(`/websites/${website.domain_folder || website.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-400 rounded-lg transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Manage Content
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
