'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface GeneratedVariation {
  id: number;
  title: string;
  content: string;
  platform: 'facebook' | 'google_business';
}

type Step = 'input' | 'generating' | 'select' | 'saving';

export default function CreatePostPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [platform, setPlatform] = useState<'facebook' | 'google_business'>('facebook');
  const [variations, setVariations] = useState<GeneratedVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic or idea');
      return;
    }

    setError(null);
    setStep('generating');

    try {
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          additionalContext: additionalContext.trim(),
          platform
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate variations');
      }

      const data = await response.json();
      setVariations(data.variations);
      setStep('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('input');
    }
  };

  const handleApprove = async () => {
    if (selectedVariation === null) {
      setError('Please select a variation to approve');
      return;
    }

    setError(null);
    setStep('saving');

    const selected = variations.find(v => v.id === selectedVariation);
    if (!selected) return;

    try {
      // Create the post in the database
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selected.title,
          content: selected.content,
          platform: selected.platform
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save post');
      }

      // Redirect to approvals page
      router.push('/social/CCA/approvals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('select');
    }
  };

  const handleStartOver = () => {
    setStep('input');
    setVariations([]);
    setSelectedVariation(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/social/CCA" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to CCA Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Create New Post</h1>
              <p className="text-slate-400 text-sm mt-0.5">AI-powered social media content generation</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 'input' ? 'text-emerald-400' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'input' ? 'bg-emerald-500 text-white' :
              (step === 'generating' || step === 'select' || step === 'saving') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
              'bg-slate-700 text-slate-400'
            }`}>1</div>
            <span className="font-medium text-sm">Enter Topic</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-700">
            <div className={`h-full transition-all duration-300 ${
              (step === 'generating' || step === 'select' || step === 'saving') ? 'w-full bg-emerald-500' : 'w-0'
            }`} />
          </div>
          <div className={`flex items-center gap-2 ${step === 'select' ? 'text-emerald-400' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'select' ? 'bg-emerald-500 text-white' :
              step === 'saving' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
              'bg-slate-700 text-slate-400'
            }`}>2</div>
            <span className="font-medium text-sm">Select Variation</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-700">
            <div className={`h-full transition-all duration-300 ${
              step === 'saving' ? 'w-full bg-emerald-500' : 'w-0'
            }`} />
          </div>
          <div className={`flex items-center gap-2 ${step === 'saving' ? 'text-emerald-400' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'saving' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}>3</div>
            <span className="font-medium text-sm">Approve</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Input Form */}
        {step === 'input' && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-medium text-white mb-4">What would you like to post about?</h2>

            <div className="space-y-5">
              {/* Topic Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Topic or Idea <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Workers comp requirements for roofing contractors in Arizona"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Context (optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add any specific details, key points, or tone preferences..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Platform
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPlatform('facebook')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                      platform === 'facebook'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="font-medium">Facebook</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setPlatform('google_business')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                      platform === 'google_business'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="font-medium">Google Business</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate 3 Variations
              </button>
            </div>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-white mb-2">Generating Variations</h2>
            <p className="text-slate-400">AI is creating 3 unique post variations for you...</p>
          </div>
        )}

        {/* Step 2: Select Variation */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Select Your Preferred Version</h2>
              <button
                onClick={handleStartOver}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Start Over
              </button>
            </div>

            <div className="grid gap-4">
              {variations.map((variation, index) => (
                <div
                  key={variation.id}
                  onClick={() => setSelectedVariation(variation.id)}
                  className={`relative bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 p-5 cursor-pointer transition-all ${
                    selectedVariation === variation.id
                      ? 'border-emerald-500/70 bg-emerald-500/5'
                      : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  {/* Selection indicator */}
                  <div className="absolute top-4 right-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedVariation === variation.id
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-500'
                    }`}>
                      {selectedVariation === variation.id && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Version label */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-full text-xs font-medium text-slate-300 mb-3">
                    <span>Version {index + 1}</span>
                    <span className="text-slate-500">|</span>
                    <span className={platform === 'facebook' ? 'text-blue-400' : 'text-emerald-400'}>
                      {platform === 'facebook' ? 'Facebook' : 'Google Business'}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-white font-medium mb-2 pr-8">{variation.title}</h3>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{variation.content}</p>
                </div>
              ))}
            </div>

            {/* Approve Button */}
            <button
              onClick={handleApprove}
              disabled={selectedVariation === null}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve Selected Version
            </button>
          </div>
        )}

        {/* Step: Saving */}
        {step === 'saving' && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-white mb-2">Saving Post</h2>
            <p className="text-slate-400">Adding to approval queue...</p>
          </div>
        )}
      </div>
    </div>
  );
}
