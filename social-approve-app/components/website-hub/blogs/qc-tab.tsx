'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Code,
  Database,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ArticleStatus {
  slug: string;
  hasResearch: boolean;
  hasDraft: boolean;
  hasHtml: boolean;
  hasSchema: boolean;
  completionLevel: 'complete' | 'needs-schema' | 'needs-html' | 'needs-draft' | 'needs-research';
  researchFolders: number;
  missingComponents: string[];
}

interface QCScanResult {
  domain: string;
  timestamp: string;
  totalArticles: number;
  complete: number;
  needsSchema: number;
  needsHtml: number;
  needsDraft: number;
  needsResearch: number;
  articles: ArticleStatus[];
  recommendations: string[];
}

interface QCTabProps {
  domain: string;
}

export function BlogQCTab({ domain }: QCTabProps) {
  const [scanData, setScanData] = useState<QCScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleStatus | null>(null);
  const [qcTask, setQcTask] = useState<string>('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const runScan = async () => {
    console.log('[QC-TAB] Starting scan for domain:', domain);
    setIsLoading(true);
    toast.loading('Scanning articles...', { id: 'qc-scan' });
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const url = `/api/websites/article-queue/qc?domain=${encodeURIComponent(domain)}&t=${timestamp}`;
      console.log('[QC-TAB] Fetching:', url);

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('[QC-TAB] Response status:', response.status);
      const data = await response.json();
      console.log('[QC-TAB] Data received:', data.totalArticles, 'articles,', data.complete, 'complete');

      if (response.ok) {
        setScanData(data);
        toast.success('QC Scan Complete', {
          id: 'qc-scan',
          description: `Scanned ${data.totalArticles} articles. ${data.complete} complete, ${data.totalArticles - data.complete} need attention.`
        });
      } else {
        throw new Error(data.error || 'Failed to scan');
      }
    } catch (error: any) {
      console.error('[QC-TAB] Scan error:', error);
      toast.error('Scan Failed', {
        id: 'qc-scan',
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getQCTask = async (articleSlug?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/websites/article-queue/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          articleSlug,
          action: 'fix-one'
        })
      });
      const data = await response.json();

      if (response.ok) {
        if (data.targetArticle) {
          setSelectedArticle(data.targetArticle);
          setQcTask(data.qcTask);
          toast.success('QC Task Generated', {
            description: `Ready to fix: ${data.targetArticle.slug}`
          });
        } else {
          toast.info('All Complete!', {
            description: 'No articles need fixing.'
          });
        }
      } else {
        throw new Error(data.error || 'Failed to generate task');
      }
    } catch (error: any) {
      toast.error('Failed to Generate Task', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!', {
      description: 'QC task copied to clipboard. Paste into Claude Code.'
    });
  };

  const getStatusBadge = (level: string) => {
    switch (level) {
      case 'complete':
        return <Badge className="bg-green-500">Complete</Badge>;
      case 'needs-schema':
        return <Badge className="bg-yellow-500">Needs Schema</Badge>;
      case 'needs-html':
        return <Badge className="bg-orange-500">Needs HTML</Badge>;
      case 'needs-draft':
        return <Badge className="bg-red-500">Needs Draft</Badge>;
      case 'needs-research':
        return <Badge className="bg-red-700">Needs Research</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  useEffect(() => {
    runScan();
  }, [domain]);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Article Quality Control</CardTitle>
              <CardDescription>
                Scan and fix incomplete article research
              </CardDescription>
            </div>
            <Button onClick={runScan} disabled={isLoading} className="min-w-[120px]">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Scanning...' : 'Scan'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !scanData && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Loading article data...</span>
            </div>
          )}
          {scanData && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Completion Rate</span>
                  <span>{Math.round((scanData.complete / scanData.totalArticles) * 100)}%</span>
                </div>
                <Progress
                  value={(scanData.complete / scanData.totalArticles) * 100}
                  className="h-3"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{scanData.complete}</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-500">{scanData.needsSchema}</div>
                  <div className="text-xs text-muted-foreground">Need Schema</div>
                </div>
                <div className="text-center p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-500">{scanData.needsHtml}</div>
                  <div className="text-xs text-muted-foreground">Need HTML</div>
                </div>
                <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{scanData.needsDraft}</div>
                  <div className="text-xs text-muted-foreground">Need Draft</div>
                </div>
                <div className="text-center p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">{scanData.needsResearch}</div>
                  <div className="text-xs text-muted-foreground">Need Research</div>
                </div>
              </div>

              {/* Recommendations */}
              {scanData.recommendations.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="text-sm space-y-1">
                    {scanData.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Fix Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Fix</CardTitle>
          <CardDescription>
            Generate a focused task to fix one incomplete article at a time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => getQCTask()}
              disabled={isLoading || !scanData || scanData.complete === scanData.totalArticles}
            >
              Fix Next Incomplete Article
            </Button>
          </div>

          {selectedArticle && qcTask && (
            <Card className="border-2 border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Task Generated
                  </CardTitle>
                  {getStatusBadge(selectedArticle.completionLevel)}
                </div>
                <CardDescription>
                  Article: <span className="font-mono font-medium">{selectedArticle.slug}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted p-4 rounded-lg relative border">
                  <Button
                    size="sm"
                    variant="default"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(qcTask)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Task
                  </Button>
                  <pre className="text-sm whitespace-pre-wrap pr-24 font-mono">
                    {qcTask}
                  </pre>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    Next Steps:
                  </p>
                  <ol className="text-sm text-muted-foreground mt-1 list-decimal list-inside space-y-1">
                    <li>Click &quot;Copy Task&quot; above</li>
                    <li>Open a new Claude Code terminal session</li>
                    <li>Paste the task and press Enter</li>
                    <li>Claude will complete the missing components</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Article List */}
      <Card>
        <CardHeader>
          <CardTitle>All Articles ({scanData?.totalArticles || 0})</CardTitle>
          <CardDescription>
            Click an article to see details and generate fix task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {scanData && scanData.articles.length > 0 ? (
              <div className="space-y-2">
                {scanData.articles.map((article) => (
                  <div key={article.slug} className="border rounded-lg">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedArticle(
                        expandedArticle === article.slug ? null : article.slug
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {expandedArticle === article.slug ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium text-sm">{article.slug}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(article.completionLevel)}
                      </div>
                    </div>

                    {expandedArticle === article.slug && (
                      <div className="p-3 pt-0 space-y-3 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span>Research: {article.researchFolders}/4</span>
                            {getStatusIcon(article.hasResearch)}
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>Draft</span>
                            {getStatusIcon(article.hasDraft)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-muted-foreground" />
                            <span>HTML</span>
                            {getStatusIcon(article.hasHtml)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span>Schema</span>
                            {getStatusIcon(article.hasSchema)}
                          </div>
                        </div>

                        {article.missingComponents.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Missing: </span>
                            <span className="text-red-500">
                              {article.missingComponents.join(', ')}
                            </span>
                          </div>
                        )}

                        {article.completionLevel !== 'complete' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              getQCTask(article.slug);
                            }}
                          >
                            Generate Fix Task
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isLoading ? 'Scanning...' : 'No articles found. Run a scan first.'}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
