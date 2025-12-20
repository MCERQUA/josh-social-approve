'use client';

import { useState } from 'react';

// Tab icons as inline SVGs
const Icons = {
  Ideas: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  TopicalMap: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  Queue: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  Workflow: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  QC: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Library: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  Automation: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

interface BlogsHubProps {
  domain: string;
}

type TabId = 'ideas' | 'topical-map' | 'queue' | 'workflow' | 'qc' | 'library' | 'automation';

const tabs: { id: TabId; label: string; icon: React.FC }[] = [
  { id: 'ideas', label: 'Ideas', icon: Icons.Ideas },
  { id: 'topical-map', label: 'Topical Map', icon: Icons.TopicalMap },
  { id: 'queue', label: 'Queue', icon: Icons.Queue },
  { id: 'workflow', label: 'Workflow', icon: Icons.Workflow },
  { id: 'qc', label: 'QC', icon: Icons.QC },
  { id: 'library', label: 'Library', icon: Icons.Library },
  { id: 'automation', label: 'Automation', icon: Icons.Automation },
];

export function BlogsHub({ domain }: BlogsHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>('queue');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Blog Management</h2>
          <p className="text-slate-400">
            AI-powered blog planning, research, and scheduling
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-6">
        {activeTab === 'ideas' && <BlogIdeasTab domain={domain} />}
        {activeTab === 'topical-map' && <BlogTopicalMapTab domain={domain} />}
        {activeTab === 'queue' && <BlogQueueTab domain={domain} />}
        {activeTab === 'workflow' && <BlogWorkflowTab domain={domain} />}
        {activeTab === 'qc' && <BlogQCTab domain={domain} />}
        {activeTab === 'library' && <BlogLibraryTab domain={domain} />}
        {activeTab === 'automation' && <BlogAutomationTab domain={domain} />}
      </div>
    </div>
  );
}

// Placeholder components - will be replaced with full implementations
function BlogIdeasTab({ domain }: { domain: string }) {
  return (
    <div className="text-center py-12">
      <Icons.Ideas />
      <h3 className="text-lg font-medium text-white mt-4">Blog Ideas</h3>
      <p className="text-slate-400 mt-2">Add new blog article ideas for {domain}</p>
      <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
    </div>
  );
}

function BlogTopicalMapTab({ domain }: { domain: string }) {
  return (
    <div className="text-center py-12">
      <Icons.TopicalMap />
      <h3 className="text-lg font-medium text-white mt-4">Topical Map</h3>
      <p className="text-slate-400 mt-2">Content hierarchy for {domain}</p>
      <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
    </div>
  );
}

function BlogQueueTab({ domain }: { domain: string }) {
  return (
    <div className="text-center py-12">
      <Icons.Queue />
      <h3 className="text-lg font-medium text-white mt-4">Article Queue</h3>
      <p className="text-slate-400 mt-2">Manage research queue for {domain}</p>
      <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
    </div>
  );
}

function BlogWorkflowTab({ domain }: { domain: string }) {
  return (
    <div className="text-center py-12">
      <Icons.Workflow />
      <h3 className="text-lg font-medium text-white mt-4">Research Workflow</h3>
      <p className="text-slate-400 mt-2">7-phase autonomous research for {domain}</p>
      <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
    </div>
  );
}

function BlogQCTab({ domain }: { domain: string }) {
  return (
    <div className="text-center py-12">
      <Icons.QC />
      <h3 className="text-lg font-medium text-white mt-4">Quality Control</h3>
      <p className="text-slate-400 mt-2">Article completion status for {domain}</p>
      <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
    </div>
  );
}

function BlogLibraryTab({ domain }: { domain: string }) {
  return (
    <div className="text-center py-12">
      <Icons.Library />
      <h3 className="text-lg font-medium text-white mt-4">Article Library</h3>
      <p className="text-slate-400 mt-2">Completed articles for {domain}</p>
      <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
    </div>
  );
}

function BlogAutomationTab({ domain }: { domain: string }) {
  return (
    <div className="text-center py-12">
      <Icons.Automation />
      <h3 className="text-lg font-medium text-white mt-4">Automation Settings</h3>
      <p className="text-slate-400 mt-2">Scheduled research for {domain}</p>
      <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
    </div>
  );
}
