'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Sparkles, Plus, ListPlus, Target, TrendingUp } from 'lucide-react';

interface TitleSuggestion {
  title: string;
  target_keyword: string;
  cluster_match: string;
  fills_gap: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  suggested_word_count: number;
  estimated_traffic: number;
  priority_score: number;
}

export function BlogIdeasTab() {
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setGenerating(true);

    // TODO: Replace with actual API call
    setTimeout(() => {
      setSuggestions([
        {
          title: 'Phoenix Roofing Insurance: What Contractors Need to Know About Rising Costs in 2025',
          target_keyword: 'phoenix roofing insurance cost',
          cluster_match: 'Cluster 3: Location Services',
          fills_gap: true,
          difficulty: 'medium',
          suggested_word_count: 5200,
          estimated_traffic: 450,
          priority_score: 85
        },
        {
          title: 'How Much Does Roofing Insurance Cost Phoenix Contractors? Complete 2025 Breakdown',
          target_keyword: 'roofing insurance cost phoenix',
          cluster_match: 'Cluster 2: Cost & Pricing',
          fills_gap: true,
          difficulty: 'medium',
          suggested_word_count: 5400,
          estimated_traffic: 380,
          priority_score: 82
        },
        {
          title: 'Phoenix Roofing Contractors: 7 Insurance Cost Factors You Must Know',
          target_keyword: 'phoenix roofing contractor insurance',
          cluster_match: 'Cluster 1: Insurance Basics',
          fills_gap: false,
          difficulty: 'easy',
          suggested_word_count: 4800,
          estimated_traffic: 320,
          priority_score: 78
        }
      ]);
      setGenerating(false);
    }, 1500);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'hard': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI-Powered Blog Ideas & Title Suggestions
          </CardTitle>
          <CardDescription>
            Enter a topic or idea and get AI-generated title suggestions based on your topical map and keyword research
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic or Idea</label>
            <Textarea
              placeholder="e.g., roofing insurance costs in Phoenix, workers comp for HVAC contractors, spray foam safety requirements..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!topic.trim() || generating}
            className="w-full sm:w-auto gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? 'Generating Suggestions...' : 'Generate Title Suggestions'}
          </Button>
        </CardContent>
      </Card>

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">AI-Suggested Titles</h3>
            <span className="text-sm text-muted-foreground">
              ({suggestions.length} suggestions based on topical map)
            </span>
          </div>

          {suggestions.map((suggestion, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <h4 className="text-lg font-semibold leading-tight">
                      {suggestion.title}
                    </h4>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Target Keyword:</span>
                      <p className="font-medium">{suggestion.target_keyword}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Topical Map Match:</span>
                      <p className="font-medium">{suggestion.cluster_match}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Difficulty:</span>
                      <p>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(suggestion.difficulty)}`}>
                          {suggestion.difficulty.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Suggested Word Count:</span>
                      <p className="font-medium">{suggestion.suggested_word_count.toLocaleString()} words</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. Monthly Traffic:</span>
                      <p className="font-medium flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {suggestion.estimated_traffic} visits
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority Score:</span>
                      <p className="font-medium">{suggestion.priority_score}/100</p>
                    </div>
                  </div>

                  {/* Gap Indicator */}
                  {suggestion.fills_gap && (
                    <div className="flex items-center gap-2 text-sm bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-3 py-2 rounded">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Fills Content Gap</span>
                      <span className="text-muted-foreground">- This topic is missing from your current coverage</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button variant="default" className="gap-2 flex-1 sm:flex-none">
                      <ListPlus className="h-4 w-4" />
                      Add to Planning
                    </Button>
                    <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                      <Plus className="h-4 w-4" />
                      Add to Queue Immediately
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !generating && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground space-y-2">
              <Sparkles className="h-12 w-12 mx-auto opacity-20" />
              <p className="text-lg">Enter a topic above to get AI-powered title suggestions</p>
              <p className="text-sm">
                Our AI will analyze your topical map and keyword research to suggest compelling titles
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
