'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Brand {
  id: number;
  slug: string;
  name: string;
  short_name: string;
}

interface GeneratedVariation {
  id: number;
  title: string;
  content: string;
}

type Step = 'input' | 'generating' | 'select' | 'saving';

export default function CreatePostPage() {
  const router = useRouter();
  const params = useParams();
  const brandSlug = (params.brand as string)?.toLowerCase();
  const brandPath = `/social/${(params.brand as string)?.toUpperCase()}`;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [step, setStep] = useState<Step>('input');
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [variations, setVariations] = useState<GeneratedVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brandSlug) {
      fetchBrand();
    }
  }, [brandSlug]);

  const fetchBrand = async () => {
    try {
      const tenantRes = await fetch('/api/tenant');
      if (!tenantRes.ok) throw new Error('Failed to fetch tenant');
      const tenantData = await tenantRes.json();

      const foundBrand = tenantData.brands?.find(
        (b: Brand) => b.slug.toLowerCase() === brandSlug
      );

      if (foundBrand) {
        setBrand(foundBrand);
      }
    } catch (err) {
      console.error('Error fetching brand:', err);
    }
  };

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
          brand: brandSlug
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
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selected.title,
          content: selected.content,
          brand: brandSlug
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save post');
      }

      router.push(`${brandPath}/approvals`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('select');
    }
  };

  const handleStartOver = () => {
    setStep('input');
    setVariations([]);
    setSelectedVariation(null);
    setEditingId(null);
    setError(null);
  };

  const startEditing = (variation: GeneratedVariation) => {
    setEditingId(variation.id);
    setEditTitle(variation.title);
    setEditContent(variation.content);
    setSelectedVariation(variation.id);
  };

  const saveEdit = () => {
    if (editingId === null) return;

    setVariations(prev => prev.map(v =>
      v.id === editingId
        ? { ...v, title: editTitle, content: editContent }
        : v
    ));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href={brandPath} className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {brand?.name || 'Dashboard'}
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
            <span className="font-medium text-sm">Select & Edit</span>
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
              <div>
                <h2 className="text-lg font-medium text-white">Select Your Preferred Version</h2>
                <p className="text-sm text-slate-400 mt-1">Click Edit to customize any variation</p>
              </div>
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
                  className={`relative bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 p-5 transition-all ${
                    selectedVariation === variation.id
                      ? 'border-emerald-500/70 bg-emerald-500/5'
                      : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  {editingId === variation.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 rounded-full text-xs font-medium text-amber-400">
                          Editing Version {index + 1}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                            Cancel
                          </button>
                          <button onClick={saveEdit} className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                            Save Changes
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Content</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={8}
                          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(variation);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-400 hover:text-white bg-emerald-500/20 hover:bg-emerald-600 border border-emerald-500/50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <div
                          onClick={() => setSelectedVariation(variation.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                            selectedVariation === variation.id
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-slate-500 hover:border-slate-400'
                          }`}
                        >
                          {selectedVariation === variation.id && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>

                      <div onClick={() => setSelectedVariation(variation.id)} className="cursor-pointer">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-full text-xs font-medium text-slate-300 mb-3">
                          <span>Version {index + 1}</span>
                        </div>
                        <h3 className="text-white font-medium mb-2 pr-24">{variation.title}</h3>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{variation.content}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleApprove}
              disabled={selectedVariation === null || editingId !== null}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {editingId !== null ? 'Save edits first' : 'Approve Selected Version'}
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
