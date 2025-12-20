'use client';

import { useState } from 'react';

interface QueueArticle {
  id: string;
  title: string;
  slug: string;
  target_keyword: string;
  cluster: string;
  cluster_priority: 'high' | 'medium' | 'low';
  status: string;
  order: number;
  estimated_hours: number;
}

interface ArticleQueueViewerProps {
  articles: QueueArticle[];
}

export function ArticleQueueViewer({ articles }: ArticleQueueViewerProps) {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCluster, setFilterCluster] = useState<string>('all');

  // Get unique clusters for filter
  const clusters = [...new Set(articles.map(a => a.cluster))];

  // Filter articles
  const filteredArticles = articles.filter(article => {
    if (filterPriority !== 'all' && article.cluster_priority !== filterPriority) return false;
    if (filterCluster !== 'all' && article.cluster !== filterCluster) return false;
    return true;
  });

  // Calculate total estimated hours
  const totalHours = filteredArticles.reduce((sum, a) => sum + a.estimated_hours, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'low':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'researching':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'planned':
      default:
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-slate-500/20 text-slate-400">
            Queued
          </span>
        );
    }
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-white mb-2">No Articles in Queue</h3>
        <p className="text-slate-400">Your article queue is empty. New content will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Blog Article Queue</h2>
          <p className="text-slate-400 text-sm mt-1">
            {filteredArticles.length} articles queued ({totalHours.toFixed(1)} estimated hours)
          </p>
        </div>

        <div className="flex gap-2">
          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Cluster Filter */}
          <select
            value={filterCluster}
            onChange={(e) => setFilterCluster(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500 max-w-[200px]"
          >
            <option value="all">All Topics</option>
            {clusters.map(cluster => (
              <option key={cluster} value={cluster}>
                {cluster}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-900/50 border-b border-slate-700/50 text-xs font-medium text-slate-400 uppercase tracking-wide">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Article Title</div>
          <div className="col-span-2">Topic Cluster</div>
          <div className="col-span-2 text-center">Priority</div>
          <div className="col-span-2 text-center">Status</div>
        </div>

        {/* Queue Items */}
        <div className="divide-y divide-slate-700/50">
          {filteredArticles.map((article, index) => (
            <div
              key={article.id}
              className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-slate-800/50 transition-colors"
            >
              {/* Order Number */}
              <div className="hidden md:flex col-span-1 items-center justify-center">
                <span className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-medium text-slate-300">
                  {index + 1}
                </span>
              </div>

              {/* Title & Keyword */}
              <div className="col-span-5">
                <div className="flex items-start gap-2 md:hidden mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-xs font-medium text-slate-300 flex-shrink-0">
                    {index + 1}
                  </span>
                  <h3 className="font-medium text-white leading-tight">{article.title}</h3>
                </div>
                <h3 className="hidden md:block font-medium text-white mb-1">{article.title}</h3>
                <p className="text-xs text-slate-500 md:ml-0 ml-8">
                  Keyword: <span className="text-slate-400">{article.target_keyword}</span>
                </p>
              </div>

              {/* Topic Cluster */}
              <div className="col-span-2 flex items-center md:ml-0 ml-8">
                <span className="text-sm text-slate-300 truncate" title={article.cluster}>
                  {article.cluster}
                </span>
              </div>

              {/* Priority */}
              <div className="col-span-2 flex items-center justify-center md:ml-0 ml-8">
                <span className={`px-2 py-0.5 text-xs rounded border capitalize ${getPriorityColor(article.cluster_priority)}`}>
                  {article.cluster_priority}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center justify-center md:ml-0 ml-8">
                {getStatusBadge(article.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">
            {articles.filter(a => a.cluster_priority === 'high').length}
          </div>
          <div className="text-xs text-red-400/80">High Priority</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {articles.filter(a => a.cluster_priority === 'medium').length}
          </div>
          <div className="text-xs text-amber-400/80">Medium Priority</div>
        </div>
        <div className="bg-slate-500/10 border border-slate-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-slate-400">
            {articles.filter(a => a.cluster_priority === 'low').length}
          </div>
          <div className="text-xs text-slate-400/80">Low Priority</div>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
        <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm text-teal-300">
          <p className="font-medium">About Your Article Queue</p>
          <p className="text-teal-400/80 mt-1">
            Articles are queued based on your content strategy and topical authority plan.
            High-priority articles support your main pillar pages and target keywords.
          </p>
        </div>
      </div>
    </div>
  );
}
