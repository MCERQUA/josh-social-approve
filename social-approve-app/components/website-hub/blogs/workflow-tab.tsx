'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  PlayCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Textarea } from '@/components/ui/textarea';

interface WorkflowPhase {
  id: string;
  phase: number;
  name: string;
  description: string;
  tasks: string[];
  prompt: string;
  status: 'pending' | 'running' | 'complete';
  duration?: string;
}

interface CurrentResearch {
  title: string;
  slug: string;
  currentPhase: number;
  status: 'idle' | 'running' | 'complete';
  started?: string;
  estimatedCompletion?: string;
  nextUp?: string;
}

const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    id: 'phase-1',
    phase: 1,
    name: 'Keyword & SEO Research',
    description: 'Deep keyword analysis, search intent, and SEO opportunity identification',
    tasks: [
      'Research primary keyword: search volume, difficulty, trends',
      'Identify long-tail keyword variations and semantic keywords',
      'Analyze search intent (informational, transactional, navigational)',
      'Research local/geo-targeted keywords (if applicable)',
      'Map customer journey and user search patterns',
      'Identify People Also Ask questions and featured snippet opportunities',
      'Analyze target audience demographics and language'
    ],
    prompt: `# Phase 1: Comprehensive Keyword & SEO Research

## Objective
Conduct deep keyword analysis and search intent research for the blog topic.

## Tasks

### 1. Keyword Research
- Analyze primary keyword: search volume, difficulty, trends
- Identify 10-15 long-tail keyword variations
- Map semantic keywords and related terms
- Research voice search query patterns

### 2. Local/Geo-Targeted Research (if applicable)
- Local search volume for target keywords
- City/neighborhood-specific variations
- Regional terminology and colloquialisms
- Local regulations and requirements

### 3. User & Audience Research
- Target audience demographics
- Customer journey stage alignment
- Common objections and concerns
- Language and terminology customers use

## Output Files
- 01-keyword-research.md
- 01-local-keywords.md (if applicable)
- 01-search-intent-analysis.md
- 01-audience-research.md
- 01-paa-questions.json

## Success Criteria
- ✓ 15+ relevant keywords identified
- ✓ Search intent clearly mapped
- ✓ Target audience profile created
- ✓ PAA questions documented`,
    status: 'pending'
  },
  {
    id: 'phase-2',
    phase: 2,
    name: 'Competitor & SERP Analysis',
    description: 'Analyze top-ranking content and identify differentiation opportunities',
    tasks: [
      'Analyze top 10 ranking pages: content depth and structure',
      'Identify content gaps in existing articles',
      'Review competitor backlink profiles and engagement metrics',
      'Document unique angles competitors haven\'t covered',
      'Analyze local competitor strategies (if applicable)',
      'Create content differentiation strategy'
    ],
    prompt: `# Phase 2: Competitor Analysis & Content Gap Identification

## Objective
Analyze top-ranking content and identify opportunities for differentiation.

## Tasks

### 1. SERP Analysis
- Review top 10 ranking pages for target keyword
- Document content depth (word count, sections, headers)
- Analyze content structure and formatting
- Review technical SEO elements used

### 2. Content Gap Identification
- Identify topics covered by competitors
- Document what competitors are missing
- Find opportunities to go deeper
- Identify unique angles to pursue

### 3. Differentiation Strategy
- Define unique value proposition
- Plan depth advantages (more comprehensive)
- Identify format innovations
- Map authority building opportunities

## Output Files
- 02-serp-analysis.md
- 02-competitor-content-analysis.md
- 02-content-gaps.md
- 02-differentiation-strategy.md

## Success Criteria
- ✓ Top 10 competitors analyzed
- ✓ 5+ content gaps identified
- ✓ Clear differentiation strategy defined`,
    status: 'pending'
  },
  {
    id: 'phase-3',
    phase: 3,
    name: 'Authority Sources & Links',
    description: 'Find high-authority external sources and map internal/external linking strategy',
    tasks: [
      'Discover government sources (.gov) - minimum 5 sources',
      'Find industry association and trade sources',
      'Research statistical sources and academic studies',
      'Verify all external links (200 status code)',
      'Map internal link opportunities from sitemap',
      'Plan 10-15 internal links with anchor text',
      'Plan 8-12 external authority links'
    ],
    prompt: `# Phase 3: Authority Sources & Link Strategy

## Objective
Find high-authority external sources and create comprehensive internal/external link plan.

## Tasks

### 1. External Authority Sources

**Government Sources (.gov) - Priority 1**
- Find 5+ relevant federal/state agencies
- Document official statistics and data
- Verify links are current and working

**Industry Associations - Priority 2**
- Identify 3-5 relevant trade associations
- Find industry research and reports
- Document certification bodies

**Statistical Sources - Priority 3**
- Government statistics (BLS, Census)
- Academic studies and research
- Industry benchmark data

### 2. Internal Link Mapping
- Scan website sitemap for linkable pages
- Identify service pages (2-3 links)
- Find related blog articles (4-6 links)
- Plan anchor text and placement

### 3. Link Verification
- Test all external links (200 status)
- Test all internal links (200 status)
- Verify pages exist on live site

## Output Files
- 03-government-sources.md
- 03-industry-sources.md
- 03-statistical-sources.md
- 03-internal-link-plan.md
- 03-external-link-plan.md
- 03-link-verification.json

## Quality Standards
- ✓ 5+ government sources (.gov)
- ✓ 10-15 internal links planned
- ✓ 8-12 external links planned
- ✓ 100% working links verified`,
    status: 'pending'
  },
  {
    id: 'phase-4',
    phase: 4,
    name: 'Content Structure & Optimization',
    description: 'Create comprehensive article outline with full SEO optimization',
    tasks: [
      'Develop 5-7 compelling title options',
      'Create optimized meta description',
      'Build detailed article outline (12-15 H2 sections)',
      'Plan FAQ section (15-20 questions)',
      'Design visual content plan (images, infographics)',
      'Map conversion points and CTAs',
      'Plan featured snippet optimization'
    ],
    prompt: `# Phase 4: Content Structure & Optimization Planning

## Objective
Create comprehensive 5,000+ word article outline with full SEO optimization.

## Tasks

### 1. Title & Meta Optimization
- Draft 5-7 compelling title options
- Keep under 60 characters, include primary keyword
- Avoid generic phrases ("Complete Guide", "Ultimate Guide")
- Create meta description (155 characters with CTA)
- Optimize URL structure

### 2. Article Structure
**Introduction (300-400 words)**
- Hook, pain point, promise, credibility

**Core Sections (12-15 H2 sections)**
- 400-600 words each
- 2-3 H3 subsections per H2
- Logical flow and progression

**FAQ Section (15-20 questions)**
- Schema-ready format
- 100-200 word answers

**Conclusion (200-300 words)**
- Summary, CTA, next steps

### 3. Visual Content Planning
- Hero image requirements
- 3-5 content images
- Infographic opportunities
- Custom graphics vs stock photos

### 4. Conversion & CTAs
- Primary CTA placement
- Lead magnet opportunities
- Service page linking
- Contact form integration points

## Output Files
- 04-title-options.md
- 04-meta-description.md
- 04-article-outline.md
- 04-faq-questions.md
- 04-visual-content-plan.md
- 04-conversion-points.md

## Success Criteria
- ✓ 5,000+ word article planned
- ✓ 12-15 H2 sections outlined
- ✓ 15-20 FAQ questions drafted
- ✓ Visual content plan complete`,
    status: 'pending'
  },
  {
    id: 'phase-5',
    phase: 5,
    name: 'E-E-A-T & Examples',
    description: 'Build expertise, authoritativeness, and trustworthiness with real examples',
    tasks: [
      'Document author expertise and credentials',
      'Research current year statistics (2024-2025)',
      'Find real case studies and examples',
      'Document specific dollar amounts and calculations',
      'Plan trust signals and social proof',
      'Research legal/compliance requirements',
      'Create content freshness maintenance plan'
    ],
    prompt: `# Phase 5: E-E-A-T, Examples & Authority Building

## Objective
Build expertise, authoritativeness, and trustworthiness with real examples and evidence.

## Tasks

### 1. E-E-A-T Enhancement
- Demonstrate author expertise
- Highlight credentials and certifications
- Show first-hand experience
- Document case studies and real results
- Plan trust signals and social proof

### 2. Statistical Data Collection
- Find current year statistics (2024-2025)
- Document specific dollar amounts
- Research industry benchmarks
- Source every statistic with links

### 3. Real Case Studies & Examples
- Court cases (if applicable)
- News articles and enforcement actions
- Success stories and failure examples
- Before/after comparisons

### 4. Calculation Examples
- Specific cost breakdowns
- ROI calculations
- Savings examples
- Penalty calculations

### 5. Legal & Compliance
- Industry regulations and disclaimers
- Copyright and attribution requirements
- Accessibility standards (WCAG)
- FTC disclosure requirements

## Output Files
- 05-eeat-strategy.md
- 05-statistics-database.md
- 05-case-studies.md
- 05-calculation-examples.md
- 05-legal-compliance.md

## Success Criteria
- ✓ E-E-A-T strategy documented
- ✓ 10+ current statistics sourced
- ✓ 3-5 real case studies found
- ✓ Legal compliance verified`,
    status: 'pending'
  },
  {
    id: 'phase-6',
    phase: 6,
    name: 'Distribution & Analytics',
    description: 'Plan content promotion, distribution, and measurement strategy',
    tasks: [
      'Create social media snippet variations',
      'Plan email newsletter angles',
      'Identify guest posting opportunities',
      'Map analytics KPIs to track',
      'Plan A/B testing opportunities',
      'Optimize for AI search and conversational queries'
    ],
    prompt: `# Phase 6: Distribution Strategy & Analytics Planning

## Objective
Plan content promotion, distribution, and measurement.

## Tasks

### 1. Distribution & Promotion
- Social media snippet creation
- Email newsletter angles
- Guest posting opportunities
- Local media outreach potential
- Partner sharing opportunities

### 2. Analytics Planning
- KPIs to track (rankings, traffic, conversions)
- Engagement metrics to monitor
- A/B testing opportunities
- Search Console query monitoring
- Competitor tracking setup

### 3. AI Search Optimization
- Conversational tone for AI comprehension
- Natural language pattern usage
- Entity relationship clarification
- Fact-checking and accuracy
- Clear topic modeling

## Output Files
- 06-distribution-strategy.md
- 06-analytics-plan.md
- 06-ai-optimization.md
- 06-social-media-snippets.md

## Success Criteria
- ✓ Distribution strategy documented
- ✓ Analytics plan complete
- ✓ Social media content prepared`,
    status: 'pending'
  },
  {
    id: 'phase-7',
    phase: 7,
    name: 'Final Audit & Compilation',
    description: 'Compile all research and conduct comprehensive SEO audit',
    tasks: [
      'Conduct comprehensive SEO audit',
      'Verify keyword optimization throughout',
      'Plan schema markup (Article, FAQ, HowTo)',
      'Audit image SEO (alt text, file names)',
      'Verify readability and style',
      'Calculate quality score (target: 95-100)',
      'Compile final publication-ready brief'
    ],
    prompt: `# Phase 7: Final Brief Compilation & SEO Audit

## Objective
Compile all research and conduct comprehensive SEO audit of planned content.

## Tasks

### 1. Comprehensive SEO Audit

**Keyword Optimization**
- Target keyword properly integrated
- Semantic keywords distributed
- Keyword density appropriate (1-2%)
- Natural language flow maintained

**Schema Markup**
- Article schema planned
- FAQ schema ready
- HowTo schema (if applicable)
- BreadcrumbList schema

**Image SEO**
- All images have descriptive filenames
- Alt text includes keywords naturally
- Image compression plan (WebP format)
- File size optimization (<150KB)

**Technical SEO**
- URL structure optimized
- Meta title/description optimized
- Header hierarchy correct (H1 → H2 → H3)
- Mobile responsiveness planned

**Readability & Style**
- Reading level appropriate (grade 8-10)
- Paragraph length optimal (2-4 sentences)
- Active voice predominant
- Scannable format (bullets, lists, callouts)

### 2. Complete Publication-Ready Brief
- Selected title
- Complete outline with word counts
- All internal/external links mapped
- FAQ questions and answers
- Visual content requirements
- Schema markup plan
- Distribution strategy

### 3. Quality Score Calculation
**Scoring (100 points total):**
- Word count: 5,000+ = 10 points
- Internal links: 10-15+ = 10 points
- External links: 8-12+ = 10 points
- Government sources: 4-5+ = 10 points
- Images planned: 4-6+ = 10 points
- FAQ questions: 15-20+ = 10 points
- Callout boxes: 3-5+ = 10 points
- Data tables: 1-2+ = 10 points
- Sections (H2): 12-15+ = 10 points
- SEO audit passed = 10 points

**Target: 95-100 points (Gold Standard)**

## Output Files
- BRIEF.md (Master publication-ready brief)
- RESEARCH.md (All research consolidated)
- OUTLINE.md (Detailed structure)
- LINKS.json (All verified links)
- SEO-AUDIT.md (Comprehensive audit)
- SCHEMA-PLAN.json (Schema specifications)
- IMAGE-SEO-PLAN.md (Image optimization)
- QUALITY-SCORE.json (Quality assessment)
- STATUS.json (Metadata)

## Success Criteria
- ✓ SEO audit 100% passed
- ✓ Quality score 95-100
- ✓ All links verified (100%)
- ✓ Brief ready for writing`,
    status: 'pending'
  }
];

export function BlogWorkflowTab({ domain }: { domain: string }) {
  const [currentResearch, setCurrentResearch] = useState<CurrentResearch>({
    title: 'No active research',
    slug: '',
    currentPhase: 0,
    status: 'idle'
  });
  const [phases, setPhases] = useState<WorkflowPhase[]>(WORKFLOW_PHASES);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [editingPhase, setEditingPhase] = useState<WorkflowPhase | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchWorkflowStatus();
  }, [domain]);

  const fetchWorkflowStatus = async () => {
    try {
      const response = await fetch(`/api/websites/blog-workflow?domain=${encodeURIComponent(domain)}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentResearch(data.currentResearch || currentResearch);

        // Update phase statuses based on current research
        if (data.currentResearch && data.currentResearch.status === 'running') {
          const updatedPhases = phases.map(phase => {
            if (phase.phase < data.currentResearch.currentPhase) {
              return { ...phase, status: 'complete' as const };
            } else if (phase.phase === data.currentResearch.currentPhase) {
              return { ...phase, status: 'running' as const };
            }
            return phase;
          });
          setPhases(updatedPhases);
        }
      }
    } catch (error) {
      console.error('Failed to fetch workflow status:', error);
    }
  };

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const handleEditClick = (phase: WorkflowPhase) => {
    setEditingPhase(phase);
    setEditedPrompt(phase.prompt);
  };

  const handleSavePrompt = async () => {
    if (!editingPhase) return;

    try {
      const response = await fetch('/api/websites/blog-workflow/update-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          phaseId: editingPhase.id,
          prompt: editedPrompt
        })
      });

      if (response.ok) {
        // Update local state
        const updatedPhases = phases.map(p =>
          p.id === editingPhase.id ? { ...p, prompt: editedPrompt } : p
        );
        setPhases(updatedPhases);
        setEditingPhase(null);
        setShowConfirmation(false);
      }
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Complete</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Running</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Research Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentResearch.status === 'running' ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <PlayCircle className="h-5 w-5 text-muted-foreground" />
            )}
            Current Research Status
          </CardTitle>
          <CardDescription>
            Track the active blog research process and upcoming queue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Currently Processing</p>
              <p className="font-medium">{currentResearch.title}</p>
              {currentResearch.status === 'running' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Phase {currentResearch.currentPhase} of 7
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {currentResearch.status === 'running' ? (
                <Badge className="bg-blue-500">Processing</Badge>
              ) : (
                <Badge variant="outline">Idle</Badge>
              )}
            </div>
          </div>

          {currentResearch.nextUp && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Next Up</p>
              <p className="font-medium">{currentResearch.nextUp}</p>
            </div>
          )}

          {currentResearch.status === 'running' && currentResearch.estimatedCompletion && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Estimated Completion</p>
              <p className="font-medium">
                {new Date(currentResearch.estimatedCompletion).toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Phases */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Research Workflow Phases</h3>
          <p className="text-sm text-muted-foreground">
            Generic workflow used to process every blog article. Click to expand phases and view/edit prompts.
          </p>
        </div>

        <div className="space-y-3">
          {phases.map((phase) => (
            <Card key={phase.id} className={phase.status === 'running' ? 'border-blue-500' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(phase.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">
                          Phase {phase.phase}: {phase.name}
                        </CardTitle>
                        {getStatusBadge(phase.status)}
                      </div>
                      <CardDescription className="text-sm">
                        {phase.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(phase)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePhase(phase.id)}
                    >
                      {expandedPhases.has(phase.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedPhases.has(phase.id) && (
                <CardContent className="pt-0 space-y-4">
                  {/* Task List */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Tasks:</h4>
                    <ul className="space-y-1.5">
                      {phase.tasks.map((task, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground mt-0.5">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Prompt Display */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Claude Code Prompt:</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(phase)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Prompt
                      </Button>
                    </div>
                    <div className="bg-slate-950 dark:bg-slate-950 rounded-lg p-4 border border-slate-800">
                      <pre className="text-xs whitespace-pre-wrap font-mono overflow-x-auto text-green-400">
                        {phase.prompt}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Prompt Dialog */}
      <Dialog open={!!editingPhase && !showConfirmation} onOpenChange={() => setEditingPhase(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Phase {editingPhase?.phase}: {editingPhase?.name}
            </DialogTitle>
            <DialogDescription>
              Modify the Claude Code prompt for this research phase. Changes will affect all future blog research.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Enter the Claude Code prompt..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPhase(null)}>
              Cancel
            </Button>
            <Button onClick={() => setShowConfirmation(true)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Prompt Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to save these changes?
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <AlertTitle className="text-amber-800 dark:text-amber-200">Warning: Global Change</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              This will change the master prompt used for <strong>all future blog research</strong>.
              The updated prompt will be used for every blog that goes through this phase.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrompt} className="bg-amber-600 hover:bg-amber-700">
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
