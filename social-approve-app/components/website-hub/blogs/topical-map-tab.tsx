'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Map,
  CheckCircle,
  Clock,
  Microscope,
  XCircle,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface SupportingArticle {
  title: string;
  keyword: string;
  status: 'published' | 'planned' | 'researching' | 'missing';
}

interface Pillar {
  id: string;
  title: string;
  pillarPage: string;
  primaryKeyword: string;
  priority: 'high' | 'medium' | 'low';
  status: 'published' | 'planned' | 'researching' | 'missing';
  supportingArticles: SupportingArticle[];
  expanded?: boolean;
}

interface BlogTopicalMapTabProps {
  domain: string;
}

export function BlogTopicalMapTab({ domain }: BlogTopicalMapTabProps) {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTopicalMap();
  }, [domain]);

  const loadTopicalMap = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/websites/topical-map?domain=${encodeURIComponent(domain)}`);

      if (!res.ok) {
        throw new Error('Failed to load topical map');
      }

      const data = await res.json();

      if (data.message) {
        setError(data.message);
        setPillars([]);
      } else {
        // Add expanded property to each pillar
        const pillarsWithExpanded = data.pillars.map((p: Pillar, i: number) => ({
          ...p,
          expanded: i === 0 // Expand first pillar by default
        }));
        setPillars(pillarsWithExpanded);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPillars([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePillar = (id: string) => {
    setPillars(pillars.map(p =>
      p.id === id ? { ...p, expanded: !p.expanded } : p
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'planned': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'researching': return <Microscope className="h-4 w-4 text-blue-500" />;
      case 'missing': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Published';
      case 'planned': return 'Planned';
      case 'researching': return 'In Research';
      case 'missing': return 'Missing';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading topical map from content strategy...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const generateTopicalMap = async () => {
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
        // Reload the topical map after generation
        await loadTopicalMap();
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
            <Map className="h-12 w-12 opacity-20" />
            <p className="text-center">{error}</p>
            <p className="text-sm text-center max-w-md">
              Click below to generate topical map from already-processed knowledge
            </p>
            <Button
              onClick={generateTopicalMap}
              className="mt-4 gap-2"
              size="lg"
            >
              <Map className="h-4 w-4" />
              Generate Topical Map
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
      {/* Topical Map Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Topical Map Visualization
              </CardTitle>
              <CardDescription>
                SEO content structure from <code className="text-xs">04-content-strategy</code> folder
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadTopicalMap} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pillars.map((pillar) => (
              <div key={pillar.id} className="border rounded-lg">
                {/* Pillar Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors flex items-center gap-3"
                  onClick={() => togglePillar(pillar.id)}
                >
                  {pillar.expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-2 flex-1">
                    {getStatusIcon(pillar.status)}
                    <div className="flex flex-col">
                      <span className="font-semibold">{pillar.title}</span>
                      <span className="text-xs text-muted-foreground">{pillar.primaryKeyword}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                      Pillar
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getPriorityColor(pillar.priority)}`}>
                      {pillar.priority.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {pillar.supportingArticles.length} supporting articles
                  </span>
                </div>

                {/* Supporting Articles */}
                {pillar.expanded && (
                  <div className="px-4 pb-4 space-y-1">
                    {pillar.supportingArticles.map((article, idx) => (
                      <div
                        key={idx}
                        className="ml-7 pl-4 border-l-2 border-gray-200 dark:border-gray-800 py-2 flex items-center gap-3"
                      >
                        {getStatusIcon(article.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{article.title}</p>
                          <p className="text-xs text-muted-foreground">{article.keyword}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded border font-medium">
                          {getStatusText(article.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
