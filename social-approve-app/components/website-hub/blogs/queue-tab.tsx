'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  ListOrdered,
  Microscope,
  Play,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  FileText,
  ExternalLink,
  Plus,
  RefreshCw,
  Loader2,
  Sparkles,
  Edit2,
  Check,
  XCircle,
  Shuffle,
  Map as MapIcon
} from 'lucide-react';

interface QueueItem {
  id: string;
  title: string;
  slug: string;
  target_keyword: string;
  cluster?: string;
  cluster_priority?: 'high' | 'medium' | 'low';
  source: 'topical_map' | 'user_added' | 'manual';
  priority: 'high' | 'medium' | 'low';
  estimated_time_hours: number;
  order: number;
}

interface ActiveResearch {
  id: string;
  title: string;
  slug: string;
  current_phase: number;
  total_phases: number;
  started: string;
  estimated_completion: string;
  progress_percent: number;
}

interface BlogQueueTabProps {
  domain: string;
}

export function BlogQueueTab({ domain }: BlogQueueTabProps) {
  const [activeResearch] = useState<ActiveResearch | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [batchOptimizing, setBatchOptimizing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [currentlyOptimizing, setCurrentlyOptimizing] = useState<string | null>(null);
  const [randomizing, setRandomizing] = useState(false);
  const [researchingIds, setResearchingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQueue();
  }, [domain]);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/websites/article-queue?domain=${encodeURIComponent(domain)}`);

      if (!res.ok) {
        throw new Error('Failed to load article queue');
      }

      const data = await res.json();

      if (data.message) {
        setError(data.message);
        setQueueItems([]);
      } else {
        setQueueItems(data.articles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setQueueItems([]);
    } finally {
      setLoading(false);
    }
  };

  const [queuePaused] = useState(false);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'topical_map':
        return <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Topical Map</span>;
      case 'user_added':
        return <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">User Added</span>;
      case 'manual':
        return <span className="text-xs px-2 py-0.5 rounded bg-gray-500/10 text-gray-500 border border-gray-500/20">Manual Entry</span>;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const moveQueueItem = (index: number, direction: 'up' | 'down') => {
    const newQueue = [...queueItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newQueue.length) return;

    [newQueue[index], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[index]];

    newQueue.forEach((item, i) => {
      item.order = i + 1;
    });

    setQueueItems(newQueue);
  };

  const removeFromQueue = (id: string) => {
    setQueueItems(queueItems.filter(item => item.id !== id));
  };

  const startEditing = (item: QueueItem) => {
    setEditingId(item.id);
    setEditValue(item.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveTitle = async (id: string) => {
    if (!editValue.trim()) {
      cancelEditing();
      return;
    }

    setSavingId(id);

    try {
      const res = await fetch('/api/websites/article-queue/update-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          articleId: id,
          newTitle: editValue.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save title');
      }

      // Update local state
      setQueueItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, title: editValue.trim() } : item
        )
      );

      setEditingId(null);
      setEditValue('');
    } catch (err) {
      console.error('Error saving title:', err);
      alert('Failed to save title. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const optimizeTitle = async (item: QueueItem) => {
    setOptimizingId(item.id);

    try {
      const res = await fetch('/api/websites/article-queue/optimize-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          articleId: item.id,
          currentTitle: item.title,
          targetKeyword: item.target_keyword
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to optimize title');
      }

      const data = await res.json();

      // Update local state with optimized title
      setQueueItems(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, title: data.optimizedTitle } : i
        )
      );

    } catch (err) {
      console.error('Error optimizing title:', err);
      alert(err instanceof Error ? err.message : 'Failed to optimize title. Please try again.');
    } finally {
      setOptimizingId(null);
    }
  };

  const resumeResearch = async (item: QueueItem) => {
    setResearchingIds(prev => new Set(prev).add(item.id));

    try {
      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const res = await fetch('/api/websites/article-queue/resume-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          slug
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to resume research');
      }

      const data = await res.json();

      alert(
        `📝 Research Resumed!\n\n` +
        `Article: ${item.title}\n` +
        `Resuming from: Phase ${data.resumedFrom}\n` +
        `Completed phases: ${data.completedPhases.join(', ')}\n\n` +
        `The workflow will complete the remaining phases autonomously.\n\n` +
        `Estimated time: ${data.estimatedTime}\n\n` +
        `Output: ${data.outputLocation}\n\n` +
        `The process runs in detached mode - it will continue even if you close this page!`
      );

    } catch (err) {
      console.error('Error resuming research:', err);
      alert(err instanceof Error ? err.message : 'Failed to resume research. Please try again.');
      setResearchingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const startResearch = async (item: QueueItem) => {
    setResearchingIds(prev => new Set(prev).add(item.id));

    try {
      const res = await fetch('/api/websites/article-queue/start-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          articleId: item.id,
          title: item.title,
          keyword: item.target_keyword
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start research');
      }

      const data = await res.json();

      alert(
        `🚀 Research Started!\n\n` +
        `Article: ${item.title}\n` +
        `Keyword: ${item.target_keyword}\n\n` +
        `This will run autonomously for ~30-45 minutes through 9 phases:\n` +
        `1. Setup\n` +
        `2. Research (topic, keywords, links, FAQs)\n` +
        `3. Quality review\n` +
        `4. Article outline\n` +
        `5. Write draft (3500-5000 words)\n` +
        `6. Enhancement (links, images)\n` +
        `7. HTML version\n` +
        `8. Final review\n` +
        `9. Schema markup\n\n` +
        `Output: ${data.outputLocation}\n\n` +
        `You can close this page - the research will continue in the background.`
      );

      // Keep the button in "researching" state
      // User can refresh page later to see results

    } catch (err) {
      console.error('Error starting research:', err);
      alert(err instanceof Error ? err.message : 'Failed to start research. Please try again.');
      setResearchingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const randomizeQueue = async () => {
    if (queueItems.length === 0) return;

    const confirmed = window.confirm(
      `This will intelligently shuffle the queue to ensure no two articles with the same topic or city appear consecutively. Continue?`
    );

    if (!confirmed) return;

    setRandomizing(true);

    try {
      const res = await fetch('/api/websites/article-queue/randomize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to randomize queue');
      }

      const data = await res.json();

      // Reload the queue to get the new order
      await loadQueue();

      alert(data.message);

    } catch (err) {
      console.error('Error randomizing queue:', err);
      alert(err instanceof Error ? err.message : 'Failed to randomize queue. Please try again.');
    } finally {
      setRandomizing(false);
    }
  };

  const optimizeAllTitles = async () => {
    if (queueItems.length === 0) return;

    const confirmed = window.confirm(
      `This will optimize all ${queueItems.length} article titles using Claude Code. This may take a few minutes. Continue?`
    );

    if (!confirmed) return;

    setBatchOptimizing(true);
    setBatchProgress({ current: 0, total: queueItems.length });
    setCurrentlyOptimizing(null);

    try {
      // Prepare articles for batch optimization
      const articles = queueItems.map(item => ({
        articleId: item.id,
        currentTitle: item.title,
        targetKeyword: item.target_keyword
      }));

      // Process articles one at a time to show real-time progress
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];

        // Update progress
        setBatchProgress({ current: i + 1, total: queueItems.length });
        setCurrentlyOptimizing(article.currentTitle);

        try {
          // Call individual optimize endpoint
          const res = await fetch('/api/websites/article-queue/optimize-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain,
              articleId: article.articleId,
              currentTitle: article.currentTitle,
              targetKeyword: article.targetKeyword
            })
          });

          if (!res.ok) {
            throw new Error('Optimization failed');
          }

          const data = await res.json();

          // Update local state immediately
          setQueueItems(prev =>
            prev.map(item =>
              item.id === article.articleId
                ? { ...item, title: data.optimizedTitle }
                : item
            )
          );

          successCount++;

          // Small delay between requests
          if (i < articles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (err) {
          console.error(`Failed to optimize: ${article.currentTitle}`, err);
          failureCount++;
          // Continue with next article even if this one fails
        }
      }

      // Show summary
      alert(
        `Batch optimization complete!\n\n` +
        `✓ Successfully optimized: ${successCount}\n` +
        `✗ Failed: ${failureCount}\n` +
        `Total: ${queueItems.length}`
      );

    } catch (err) {
      console.error('Error in batch optimization:', err);
      alert('Batch optimization encountered an error. Some titles may have been optimized.');
    } finally {
      setBatchOptimizing(false);
      setBatchProgress({ current: 0, total: 0 });
      setCurrentlyOptimizing(null);
    }
  };

  const getPhaseText = (phase: number) => {
    const phases = [
      'Keyword & SEO Research',
      'Competitor Analysis',
      'Authority Sources & Links',
      'Content Structure',
      'E-E-A-T & Examples',
      'Distribution Strategy',
      'Final Audit'
    ];
    return phases[phase - 1] || 'Unknown Phase';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading article queue from topical map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const processKnowledge = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/websites/topical-map/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process knowledge');
      }

      if (data.success) {
        // Reload the queue after generation
        await loadQueue();
      } else {
        setError(data.message || 'Processing failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process knowledge');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <ListOrdered className="h-12 w-12 opacity-20" />
            <p className="text-center">{error}</p>
            <p className="text-sm text-center max-w-md">
              Click below to generate topical map and article queue from already-processed knowledge
            </p>
            <Button
              onClick={processKnowledge}
              className="mt-4 gap-2"
              size="lg"
            >
              <MapIcon className="h-4 w-4" />
              Generate Topical Map & Queue
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Uses topic clusters from <code className="bg-muted px-1 py-0.5 rounded text-xs">11-autonomous-research/topic-clusters/</code>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Status Header */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Queue Status</p>
              <p className="text-2xl font-bold">
                {queueItems.length} articles pending
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                From topical map clusters
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={optimizeAllTitles}
                disabled={batchOptimizing || randomizing || queueItems.length === 0}
                className="gap-2"
              >
                {batchOptimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Optimizing {batchProgress.current}/{batchProgress.total}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Optimize All Titles
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={randomizeQueue}
                disabled={batchOptimizing || randomizing || queueItems.length === 0}
                className="gap-2"
              >
                {randomizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Randomizing...
                  </>
                ) : (
                  <>
                    <Shuffle className="h-4 w-4" />
                    Randomize Queue
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={loadQueue} className="gap-2" disabled={batchOptimizing || randomizing}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Batch Optimization Progress */}
          {batchOptimizing && (
            <div className="mt-4 space-y-2 border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing...</span>
                <span className="font-semibold">{Math.round((batchProgress.current / batchProgress.total) * 100)}% Complete</span>
              </div>
              <Progress
                value={(batchProgress.current / batchProgress.total) * 100}
                className="h-2"
              />
              {currentlyOptimizing && (
                <p className="text-xs text-muted-foreground">
                  Currently optimizing: <span className="font-medium text-foreground">{currentlyOptimizing}</span>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currently Researching */}
      {activeResearch && (
        <Card className="border-blue-500/30">
          <CardHeader className="bg-blue-500/5">
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Microscope className="h-5 w-5 animate-pulse" />
              Currently Researching
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h4 className="text-lg font-semibold mb-1">{activeResearch.title}</h4>
              <p className="text-sm text-muted-foreground">
                Phase {activeResearch.current_phase} of {activeResearch.total_phases}: {getPhaseText(activeResearch.current_phase)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{activeResearch.progress_percent}% Complete</span>
              </div>
              <Progress value={activeResearch.progress_percent} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Started:</span>
                <p className="font-medium">45 minutes ago</p>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Complete:</span>
                <p className="font-medium">1h 20m</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Live Progress
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                View Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Next Up</CardTitle>
              <CardDescription>
                Drag to reorder, or use arrows to adjust queue priority
              </CardDescription>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListOrdered className="h-12 w-12 mx-auto opacity-20 mb-3" />
              <p className="text-lg">Queue is empty</p>
              <p className="text-sm">Add articles from Ideas or Topical Map tabs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queueItems.map((item, index) => {
                const isCurrentlyBatchOptimizing = batchOptimizing && currentlyOptimizing === item.title;

                return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 hover:bg-accent/30 transition-colors ${
                    isCurrentlyBatchOptimizing ? 'bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Drag Handle & Order */}
                    <div className="flex items-center gap-2 pt-1">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-bold text-muted-foreground w-6">
                        {item.order}.
                      </span>
                    </div>

                    {/* Article Info */}
                    <div className="flex-1 space-y-2">
                      {/* Editable Title */}
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveTitle(item.id);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            className="font-semibold"
                            autoFocus
                            disabled={savingId === item.id}
                          />
                          <Button
                            size="sm"
                            onClick={() => saveTitle(item.id)}
                            disabled={savingId === item.id}
                            className="gap-1"
                          >
                            {savingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            disabled={savingId === item.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 group">
                          <h4 className="font-semibold leading-tight flex-1">{item.title}</h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(item)}
                              className="h-6 w-6 p-0"
                              title="Edit title"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => optimizeTitle(item)}
                              disabled={optimizingId === item.id || batchOptimizing}
                              className="h-6 px-2 gap-1"
                              title="Optimize with Claude Code"
                            >
                              {optimizingId === item.id || isCurrentlyBatchOptimizing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )}
                              <span className="text-xs">Optimize</span>
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {getSourceBadge(item.source)}
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority.toUpperCase()}
                        </span>
                        {item.cluster && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              Cluster: <span className="font-medium text-foreground">{item.cluster}</span>
                            </span>
                          </>
                        )}
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          Est. Time: {item.estimated_time_hours} hours
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Keyword: <code className="px-1.5 py-0.5 bg-muted rounded">{item.target_keyword}</code>
                      </div>
                    </div>

                    {/* Reorder Controls */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveQueueItem(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveQueueItem(index, 'down')}
                        disabled={index === queueItems.length - 1}
                        className="h-8 w-8 p-0"
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startResearch(item)}
                          disabled={researchingIds.has(item.id)}
                          className="gap-2 whitespace-nowrap"
                        >
                          {researchingIds.has(item.id) ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Working...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Start
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resumeResearch(item)}
                          disabled={researchingIds.has(item.id)}
                          className="gap-2 whitespace-nowrap"
                          title="Resume from where it left off (smart detection)"
                        >
                          <Play className="h-4 w-4" />
                          Resume
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromQueue(item.id)}
                        className="h-9 w-9 p-0 hover:bg-red-500/10 hover:text-red-500"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
