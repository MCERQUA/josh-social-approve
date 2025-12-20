'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Library,
  FileText,
  Eye,
  Download,
  Calendar,
  Hash,
  Search,
  ChevronLeft,
  Loader2,
  FileCode,
  File,
  CheckCircle2,
  Clock,
  AlertCircle,
  Palette,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface Article {
  slug: string;
  title: string;
  keyword: string;
  createdDate: string;
  wordCount: number;
  hasHtml: boolean;
  hasDraft: boolean;
  status: 'completed' | 'draft' | 'research';
  researchFileCount: number;
  lastModified: string;
}

interface ArticleDetail {
  slug: string;
  metadata: {
    title: string;
    keyword: string;
    createdDate: string;
    wordCount: number;
    targetWordCount: string;
  };
  htmlContent: string | null;
  draftContent: string | null;
  summaryContent: string | null;
  researchFiles: Record<string, any[]>;
  hasHtml: boolean;
  hasDraft: boolean;
  status: 'completed' | 'draft' | 'research';
}

interface BlogTheme {
  domain: string;
  lastUpdated: string;
  colors: {
    background: string;
    text: string;
    headings: string;
    links: string;
    accent: string;
    muted: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
}

export function BlogLibraryTab() {
  const params = useParams();
  const domain = decodeURIComponent(params.domain as string);

  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [blogTheme, setBlogTheme] = useState<BlogTheme | null>(null);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);
  const [updatingHtml, setUpdatingHtml] = useState(false);

  useEffect(() => {
    loadArticles();
    loadBlogTheme();
  }, [domain]);

  const loadBlogTheme = async () => {
    try {
      const res = await fetch(`/api/websites/blog-theme?domain=${encodeURIComponent(domain)}`);
      const data = await res.json();
      setBlogTheme(data);
    } catch (err) {
      console.error('Error loading blog theme:', err);
    }
  };

  const saveBlogTheme = async () => {
    if (!blogTheme) return;
    setThemeLoading(true);
    try {
      const res = await fetch('/api/websites/blog-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          colors: blogTheme.colors,
          typography: blogTheme.typography
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Theme saved!', {
          description: 'Blog theme colors saved for this domain'
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('Failed to save theme', {
        description: err.message
      });
    } finally {
      setThemeLoading(false);
    }
  };

  const updateHtmlWithTheme = async () => {
    if (!articleDetail || !blogTheme) return;
    setUpdatingHtml(true);
    try {
      const res = await fetch('/api/websites/blog-theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          slug: articleDetail.slug
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('HTML updated!', {
          description: 'Article HTML now uses the saved theme colors'
        });
        // Reload article to see changes
        loadArticleDetail(articleDetail.slug);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('Failed to update HTML', {
        description: err.message
      });
    } finally {
      setUpdatingHtml(false);
    }
  };

  const applyThemeToAllArticles = async () => {
    if (!blogTheme) return;
    setUpdatingHtml(true);
    try {
      // First save the theme
      await fetch('/api/websites/blog-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          colors: blogTheme.colors,
          typography: blogTheme.typography
        })
      });

      // Then apply to all articles (no slug = all articles)
      const res = await fetch('/api/websites/blog-theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Theme applied to all articles!', {
          description: `Updated ${data.updatedCount} articles. ${data.failedCount || 0} failed.`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('Failed to apply theme', {
        description: err.message
      });
    } finally {
      setUpdatingHtml(false);
    }
  };

  const resetThemeToDefault = () => {
    setBlogTheme({
      domain,
      lastUpdated: new Date().toISOString(),
      colors: {
        background: '#ffffff',
        text: '#1f2937',
        headings: '#111827',
        links: '#2563eb',
        accent: '#3b82f6',
        muted: '#6b7280'
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        lineHeight: '1.75'
      }
    });
  };

  const updateThemeColor = (key: keyof BlogTheme['colors'], value: string) => {
    if (!blogTheme) return;
    setBlogTheme({
      ...blogTheme,
      colors: {
        ...blogTheme.colors,
        [key]: value
      }
    });
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/websites/articles/list?domain=${encodeURIComponent(domain)}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadArticleDetail = async (slug: string) => {
    setDetailLoading(true);
    setSelectedArticle(slug);
    try {
      const res = await fetch(`/api/websites/articles/${slug}?domain=${encodeURIComponent(domain)}`);
      const data = await res.json();
      setArticleDetail(data);
    } catch (err) {
      console.error('Error loading article detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'research':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-700 border-green-200',
      draft: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      research: 'bg-blue-500/10 text-blue-700 border-blue-200'
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (selectedArticle && articleDetail) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedArticle(null);
            setArticleDetail(null);
          }}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Library
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{articleDetail.metadata.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    {articleDetail.metadata.keyword}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {articleDetail.metadata.createdDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {articleDetail.metadata.wordCount.toLocaleString()} words
                  </div>
                </div>
              </div>
              {getStatusBadge(articleDetail.status)}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={articleDetail.hasHtml ? 'html' : 'research'} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                {articleDetail.hasHtml && (
                  <TabsTrigger value="html" className="gap-2">
                    <Eye className="h-4 w-4" />
                    HTML Preview
                  </TabsTrigger>
                )}
                {articleDetail.hasDraft && (
                  <TabsTrigger value="draft" className="gap-2">
                    <FileCode className="h-4 w-4" />
                    Markdown Draft
                  </TabsTrigger>
                )}
                <TabsTrigger value="research" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Research Files
                </TabsTrigger>
                <TabsTrigger value="metadata" className="gap-2">
                  <File className="h-4 w-4" />
                  Metadata
                </TabsTrigger>
              </TabsList>

              {articleDetail.hasHtml && (
                <TabsContent value="html" className="space-y-4">
                  {/* Theme Editor Panel */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Palette className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-base">Blog Theme Colors</CardTitle>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowThemeEditor(!showThemeEditor)}
                        >
                          {showThemeEditor ? 'Hide' : 'Customize'}
                        </Button>
                      </div>
                      <CardDescription>
                        Set colors for this website&apos;s blog articles
                      </CardDescription>
                    </CardHeader>
                    {showThemeEditor && blogTheme && (
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Background</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={blogTheme.colors.background}
                                onChange={(e) => updateThemeColor('background', e.target.value)}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={blogTheme.colors.background}
                                onChange={(e) => updateThemeColor('background', e.target.value)}
                                className="flex-1 px-2 py-1 text-sm rounded border bg-background"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Text Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={blogTheme.colors.text}
                                onChange={(e) => updateThemeColor('text', e.target.value)}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={blogTheme.colors.text}
                                onChange={(e) => updateThemeColor('text', e.target.value)}
                                className="flex-1 px-2 py-1 text-sm rounded border bg-background"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Headings</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={blogTheme.colors.headings}
                                onChange={(e) => updateThemeColor('headings', e.target.value)}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={blogTheme.colors.headings}
                                onChange={(e) => updateThemeColor('headings', e.target.value)}
                                className="flex-1 px-2 py-1 text-sm rounded border bg-background"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Links</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={blogTheme.colors.links}
                                onChange={(e) => updateThemeColor('links', e.target.value)}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={blogTheme.colors.links}
                                onChange={(e) => updateThemeColor('links', e.target.value)}
                                className="flex-1 px-2 py-1 text-sm rounded border bg-background"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Accent</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={blogTheme.colors.accent}
                                onChange={(e) => updateThemeColor('accent', e.target.value)}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={blogTheme.colors.accent}
                                onChange={(e) => updateThemeColor('accent', e.target.value)}
                                className="flex-1 px-2 py-1 text-sm rounded border bg-background"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Muted Text</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={blogTheme.colors.muted}
                                onChange={(e) => updateThemeColor('muted', e.target.value)}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={blogTheme.colors.muted}
                                onChange={(e) => updateThemeColor('muted', e.target.value)}
                                className="flex-1 px-2 py-1 text-sm rounded border bg-background"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Preview Box */}
                        <div
                          className="p-4 rounded-lg border"
                          style={{ backgroundColor: blogTheme.colors.background }}
                        >
                          <p className="text-xs font-medium mb-2" style={{ color: blogTheme.colors.muted }}>
                            Live Preview
                          </p>
                          <h3 style={{ color: blogTheme.colors.headings, marginBottom: '0.5rem' }}>
                            Sample Heading
                          </h3>
                          <p style={{ color: blogTheme.colors.text, marginBottom: '0.5rem' }}>
                            This is sample body text that shows how your article content will appear.
                          </p>
                          <a href="#" style={{ color: blogTheme.colors.links }} onClick={(e) => e.preventDefault()}>
                            Sample Link
                          </a>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <Button
                            onClick={saveBlogTheme}
                            disabled={themeLoading}
                            className="gap-2"
                          >
                            {themeLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save Theme
                          </Button>
                          <Button
                            variant="default"
                            onClick={applyThemeToAllArticles}
                            disabled={updatingHtml}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            {updatingHtml ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Apply to ALL Articles
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={updateHtmlWithTheme}
                            disabled={updatingHtml}
                            className="gap-2"
                          >
                            {updatingHtml ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Palette className="h-4 w-4" />
                            )}
                            Update This HTML Only
                          </Button>
                          <Button
                            variant="outline"
                            onClick={resetThemeToDefault}
                            className="gap-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reset to Default
                          </Button>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg mt-3">
                          <p className="text-sm font-medium text-blue-400 mb-2">How It Works:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li><strong>Save Theme:</strong> Saves colors - NEW articles will use these colors automatically</li>
                            <li><strong>Apply to ALL Articles:</strong> Updates ALL existing HTML files to use these colors</li>
                            <li><strong>Update This HTML Only:</strong> Updates just the currently viewed article</li>
                          </ul>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* HTML Preview */}
                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                      <span className="text-sm font-medium">Article Preview</span>
                      <span className="text-xs text-muted-foreground">
                        Background: {blogTheme?.colors.background || '#ffffff'}
                      </span>
                    </div>
                    <div
                      className="p-6 overflow-auto max-h-[800px]"
                      style={{
                        backgroundColor: blogTheme?.colors.background || '#ffffff'
                      }}
                    >
                      <div
                        className="prose prose-lg max-w-none"
                        style={{
                          '--tw-prose-body': blogTheme?.colors.text || '#1f2937',
                          '--tw-prose-headings': blogTheme?.colors.headings || '#111827',
                          '--tw-prose-links': blogTheme?.colors.links || '#2563eb',
                          color: blogTheme?.colors.text || '#1f2937'
                        } as React.CSSProperties}
                        dangerouslySetInnerHTML={{ __html: articleDetail.htmlContent || '' }}
                      />
                    </div>
                  </div>
                </TabsContent>
              )}

              {articleDetail.hasDraft && (
                <TabsContent value="draft" className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-6 overflow-auto max-h-[800px]">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {articleDetail.draftContent}
                    </pre>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="research" className="space-y-4">
                <Tabs defaultValue="keyword" className="space-y-4">
                  <TabsList className="flex flex-wrap h-auto gap-2">
                    {Object.entries(articleDetail.researchFiles).map(([key, files]) => {
                      if (files.length === 0) return null;
                      const labels: Record<string, string> = {
                        topic: 'Topic',
                        keyword: 'Keywords',
                        authority: 'Authority Links',
                        faq: 'FAQs',
                        internal: 'Internal Links',
                        outline: 'Outline',
                        design: 'Design',
                        schema: 'Schema'
                      };
                      return (
                        <TabsTrigger key={key} value={key}>
                          {labels[key]} ({files.length})
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {Object.entries(articleDetail.researchFiles).map(([key, files]) => {
                    if (files.length === 0) return null;
                    return (
                      <TabsContent key={key} value={key} className="space-y-4">
                        {files.map((file, idx) => (
                          <Card key={idx}>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center justify-between">
                                <span>{file.filename}</span>
                                <Badge variant="secondary">
                                  {(file.size / 1024).toFixed(1)} KB
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="rounded-lg border bg-muted/30 p-4 overflow-auto max-h-[400px]">
                                <pre className="whitespace-pre-wrap font-mono text-xs">
                                  {file.content}
                                </pre>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                        <dd className="mt-1 text-sm">{articleDetail.metadata.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Target Keyword</dt>
                        <dd className="mt-1 text-sm">{articleDetail.metadata.keyword}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Created Date</dt>
                        <dd className="mt-1 text-sm">{articleDetail.metadata.createdDate}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Word Count</dt>
                        <dd className="mt-1 text-sm">
                          {articleDetail.metadata.wordCount.toLocaleString()} / {articleDetail.metadata.targetWordCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                        <dd className="mt-1 text-sm">{getStatusBadge(articleDetail.status)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Files</dt>
                        <dd className="mt-1 text-sm">
                          {Object.values(articleDetail.researchFiles).flat().length} research files
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              Article Library
            </CardTitle>
            <CardDescription>
              Browse and view all completed blog articles with full research
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {articles.length} {articles.length === 1 ? 'Article' : 'Articles'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles by title or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <Library className="h-16 w-16 mx-auto text-muted-foreground/20" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {searchTerm ? 'No matching articles' : 'No articles yet'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Articles will appear here once the research workflow completes'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => (
              <Card
                key={article.slug}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => loadArticleDetail(article.slug)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {getStatusIcon(article.status)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs truncate">
                          {article.keyword}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(article.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{article.wordCount.toLocaleString()} words</span>
                      <span>{article.researchFileCount} files</span>
                    </div>
                    <span>{new Date(article.createdDate).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
