'use client';

import { useState } from 'react';

interface Article {
  id: string;
  title: string;
  keyword?: string;
  status?: string;
  estimatedWordCount?: number;
  url?: string;
}

interface Pillar {
  id: string;
  title: string;
  pillarPage?: string;
  primaryKeyword?: string;
  priority?: string;
  status?: string;
  supportingArticles?: Article[];
}

interface TopicalMapViewerProps {
  pillars: Pillar[];
  metadata: Record<string, unknown>;
}

export function TopicalMapViewer({ pillars, metadata }: TopicalMapViewerProps) {
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());

  const togglePillar = (pillarId: string) => {
    const newExpanded = new Set(expandedPillars);
    if (newExpanded.has(pillarId)) {
      newExpanded.delete(pillarId);
    } else {
      newExpanded.add(pillarId);
    }
    setExpandedPillars(newExpanded);
  };

  const expandAll = () => {
    setExpandedPillars(new Set(pillars.map(p => p.id)));
  };

  const collapseAll = () => {
    setExpandedPillars(new Set());
  };

  const getPriorityBadge = (priority?: string) => {
    const p = (priority || 'medium').toLowerCase();
    if (p.includes('high') || p.includes('critical')) {
      return <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">High</span>;
    } else if (p.includes('low')) {
      return <span className="px-2 py-0.5 text-xs rounded bg-slate-500/20 text-slate-400">Low</span>;
    }
    return <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400">Medium</span>;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'published':
        return (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center" title="Published">
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'researching':
        return (
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center" title="Researching">
            <svg className="w-3 h-3 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case 'planned':
        return (
          <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center" title="Planned">
            <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-slate-500/20 flex items-center justify-center" title="Not Started">
            <div className="w-2 h-2 rounded-full bg-slate-500"></div>
          </div>
        );
    }
  };

  if (pillars.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h3 className="text-lg font-medium text-white mb-2">No Topical Map Available</h3>
        <p className="text-slate-400">Your content strategy map is being developed.</p>
      </div>
    );
  }

  // Calculate stats
  const totalArticles = pillars.reduce((sum, p) => sum + (p.supportingArticles?.length || 0), 0);
  const publishedArticles = pillars.reduce(
    (sum, p) => sum + (p.supportingArticles?.filter(a => a.status === 'published').length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Content Topical Map</h2>
          <p className="text-slate-400 text-sm mt-1">
            {pillars.length} pillars with {totalArticles} supporting articles
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Content Progress</span>
          <span className="text-sm font-medium text-white">
            {publishedArticles} / {totalArticles} articles published
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${totalArticles > 0 ? (publishedArticles / totalArticles) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Pillars */}
      <div className="space-y-3">
        {pillars.map(pillar => (
          <div
            key={pillar.id}
            className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden"
          >
            {/* Pillar Header */}
            <button
              onClick={() => togglePillar(pillar.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/80 transition-colors"
            >
              <div className={`transform transition-transform ${expandedPillars.has(pillar.id) ? 'rotate-90' : ''}`}>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{pillar.title}</h3>
                  {getPriorityBadge(pillar.priority)}
                </div>
                {pillar.primaryKeyword && (
                  <p className="text-sm text-slate-400 mt-0.5">
                    Target: {pillar.primaryKeyword}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">
                  {pillar.supportingArticles?.length || 0} articles
                </span>
                {getStatusIcon(pillar.status)}
              </div>
            </button>

            {/* Supporting Articles */}
            {expandedPillars.has(pillar.id) && pillar.supportingArticles && pillar.supportingArticles.length > 0 && (
              <div className="border-t border-slate-700/50 bg-slate-900/30">
                <div className="divide-y divide-slate-700/30">
                  {pillar.supportingArticles.map(article => (
                    <div
                      key={article.id}
                      className="flex items-center gap-4 px-4 py-3 pl-14 hover:bg-slate-800/30"
                    >
                      {getStatusIcon(article.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{article.title}</p>
                        {article.keyword && (
                          <p className="text-xs text-slate-500 truncate">
                            Keyword: {article.keyword}
                          </p>
                        )}
                      </div>
                      {article.estimatedWordCount && (
                        <span className="text-xs text-slate-500">
                          ~{article.estimatedWordCount.toLocaleString()} words
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                        article.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : article.status === 'researching'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {article.status || 'planned'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-400 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          {getStatusIcon('published')}
          <span>Published</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon('researching')}
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon('planned')}
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span>Not Started</span>
        </div>
      </div>
    </div>
  );
}
