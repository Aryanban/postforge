import React, { useState } from 'react';
import { 
  ProjectProfile, 
  PostItem, 
  calculateHeavyRankerScore, 
  lintPostContent, 
  autoFixForAlgorithm, 
  generateDailyPostBatch, 
  generateCustomAngle, 
  AI_FRAMEWORKS, 
  extractProjectKeywords,
  splitIntoThread,
  generateCarouselDeck,
  generateSvgSlide,
  type CarouselSlide
} from '@postforge/core';
import { api, type BackendStatus } from '../lib/api/client';
import { AlgorithmScorecard } from './AlgorithmScorecard';
import { ShadowbanInspector } from './ShadowbanInspector';
import { SocialPreviewCard } from './SocialPreviewCard';
import { 
  Sparkles, 
  Calendar, 
  RotateCw, 
  Check, 
  Clock, 
  MessageSquare,
  Eye,
  Edit3,
  ListOrdered,
  Layers,
  Download,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';

interface PostStudioProps {
  project: ProjectProfile;
  onSchedulePost: (post: PostItem) => void;
  backend: BackendStatus;
}

export const PostStudio: React.FC<PostStudioProps> = ({
  project,
  onSchedulePost,
  backend,
}) => {
  const [posts, setPosts] = useState<PostItem[]>(() => generateDailyPostBatch(project));
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [scheduledSuccessId, setScheduledSuccessId] = useState<string | null>(null);
  const [aiFramework, setAiFramework] = useState(AI_FRAMEWORKS[0].id);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const currentPost = posts[activePostIndex] || posts[0];

  // Live scoring uses the project's real vocabulary for SimCluster alignment.
  const scoreContext = () => ({
    keywords: extractProjectKeywords(project),
    platform: currentPost.platform,
  });

  const updatePost = (patch: Partial<PostItem>) => {
    const base = posts[activePostIndex];
    const mainContent = patch.mainContent ?? base.mainContent;
    const replyContent = patch.replyContent ?? base.replyContent;
    const ctx = scoreContext();
    const updatedPosts = [...posts];
    updatedPosts[activePostIndex] = {
      ...base,
      ...patch,
      algorithmScore: calculateHeavyRankerScore(mainContent, replyContent, ctx),
      linterChecks: lintPostContent(mainContent, replyContent, ctx).checks,
    };
    setPosts(updatedPosts);
  };

  const handleContentChange = (newContent: string) => updatePost({ mainContent: newContent });

  const handleReplyChange = (newReply: string) => updatePost({ replyContent: newReply });

  const handleAutoFix = () => {
    const { fixedContent, replyContent } = autoFixForAlgorithm(currentPost.mainContent);
    updatePost({
      mainContent: fixedContent,
      replyContent: currentPost.replyContent || replyContent,
    });
  };

  const handleRegenerateBatch = async () => {
    if (backend.available) {
      try {
        const batch = await api.generate(project.id);
        setPosts(batch);
        setActivePostIndex(0);
        setActiveSlideIndex(0);
        return;
      } catch {
        /* fall through to local generation */
      }
    }
    setPosts(generateDailyPostBatch(project));
    setActivePostIndex(0);
    setActiveSlideIndex(0);
  };

  const handleGenerateCustom = async (framework: string) => {
    if (backend.available) {
      try {
        const batch = await api.generate(project.id, framework);
        setPosts(prev => [...batch, ...prev]);
        setActivePostIndex(0);
        setActiveSlideIndex(0);
        return;
      } catch {
        /* fall through to local generation */
      }
    }
    setPosts(prev => [generateCustomAngle(project, framework), ...prev]);
    setActivePostIndex(0);
    setActiveSlideIndex(0);
  };

  const handleQueueClick = () => {
    onSchedulePost(currentPost);
    setScheduledSuccessId(currentPost.id);
    setTimeout(() => setScheduledSuccessId(null), 2500);
  };

  const handleAIGenerate = async () => {
    setAiBusy(true);
    setAiNote(null);
    try {
      const framework = AI_FRAMEWORKS.find(f => f.id === aiFramework) ?? AI_FRAMEWORKS[0];
      const result = await api.generateAI(project.id, aiFramework, framework.platforms[0]);
      setPosts(prev => [result.post, ...prev]);
      setActivePostIndex(0);
      setActiveSlideIndex(0);
      setAiNote(
        `${result.accepted ? 'AI draft accepted' : `Best of ${result.rounds} rounds`} — score ${result.post.algorithmScore.netScore}/100 after ${result.rounds} round${result.rounds > 1 ? 's' : ''}.`
      );
    } catch (err) {
      setAiNote(`AI generation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAiBusy(false);
    }
  };

  // --- Typefully-Style Thread Splitting Handlers ---
  const isThreadMode = Boolean(currentPost.threadParts && currentPost.threadParts.length > 1);

  const handleSplitThread = () => {
    const parts = splitIntoThread(currentPost.mainContent, {
      platform: 'x',
      addNumbering: true,
      includeOutroCta: true,
    });
    if (parts.length > 0) {
      updatePost({
        platform: 'x',
        framework: 'thread-hook',
        frameworkName: '5-Tweet Algorithmic Thread',
        threadParts: parts,
        mainContent: parts[0],
      });
    }
  };

  const handleThreadPartChange = (idx: number, text: string) => {
    if (!currentPost.threadParts) return;
    const newParts = [...currentPost.threadParts];
    newParts[idx] = text;
    if (idx === 0) {
      updatePost({ threadParts: newParts, mainContent: text });
    } else {
      updatePost({ threadParts: newParts });
    }
  };

  const handleAddThreadPart = () => {
    const parts = currentPost.threadParts ? [...currentPost.threadParts] : [currentPost.mainContent];
    const nextNum = parts.length + 1;
    parts.push(`(${nextNum}/${nextNum}) Next key engineering insight...`);
    updatePost({ threadParts: parts });
  };

  const handleMoveThreadPart = (idx: number, direction: 'up' | 'down') => {
    if (!currentPost.threadParts) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentPost.threadParts.length) return;
    const parts = [...currentPost.threadParts];
    const temp = parts[idx];
    parts[idx] = parts[newIdx];
    parts[newIdx] = temp;
    updatePost({
      threadParts: parts,
      mainContent: parts[0],
    });
  };

  const handleRemoveThreadPart = (idx: number) => {
    if (!currentPost.threadParts || currentPost.threadParts.length <= 1) return;
    const parts = currentPost.threadParts.filter((_, i) => i !== idx);
    updatePost({
      threadParts: parts,
      mainContent: parts[0],
    });
  };

  const handleClearThread = () => {
    const combined = currentPost.threadParts ? currentPost.threadParts.join('\n\n') : currentPost.mainContent;
    updatePost({
      threadParts: undefined,
      mainContent: combined,
      framework: 'morning-hook',
      frameworkName: 'Single Post',
    });
  };

  // --- Taplio-Style LinkedIn Carousel Handlers ---
  const isCarouselMode = currentPost.framework === 'linkedin-carousel' || Boolean(currentPost.carouselSlides && currentPost.carouselSlides.length > 0);

  const carouselSlides: CarouselSlide[] = (currentPost.carouselSlides && currentPost.carouselSlides.length > 0)
    ? currentPost.carouselSlides
    : isCarouselMode
    ? generateCarouselDeck(currentPost.mainContent, { title: currentPost.hook || project.name, domain: project.domain })
    : [];

  const handleCreateCarousel = () => {
    const deck = generateCarouselDeck(currentPost.mainContent, {
      title: currentPost.hook || project.name,
      domain: project.domain,
    });
    updatePost({
      platform: 'linkedin',
      framework: 'linkedin-carousel',
      frameworkName: 'LinkedIn Carousel Slide Deck',
      carouselSlides: deck,
    });
    setActiveSlideIndex(0);
  };

  const handleSlideTitleChange = (newTitle: string) => {
    const updated = carouselSlides.map((s, idx) => idx === activeSlideIndex ? { ...s, title: newTitle } : s);
    updatePost({ carouselSlides: updated });
  };

  const handleSlideSubtitleChange = (newSubtitle: string) => {
    const updated = carouselSlides.map((s, idx) => idx === activeSlideIndex ? { ...s, subtitle: newSubtitle } : s);
    updatePost({ carouselSlides: updated });
  };

  const handleSlidePointsChange = (text: string) => {
    const points = text.split('\n').filter(p => p.trim());
    const updated = carouselSlides.map((s, idx) => idx === activeSlideIndex ? { ...s, bulletPoints: points } : s);
    updatePost({ carouselSlides: updated });
  };

  const handleAddSlide = () => {
    const nextNum = carouselSlides.length + 1;
    const newSlide: CarouselSlide = {
      slideNumber: nextNum,
      totalSlides: nextNum,
      title: `Key Rule ${nextNum - 1}`,
      bulletPoints: ['Practical engineering principle', 'Zero-overhead implementation detail'],
    };
    const updated = [...carouselSlides, newSlide].map(s => ({ ...s, totalSlides: nextNum }));
    updatePost({ carouselSlides: updated });
    setActiveSlideIndex(updated.length - 1);
  };

  const handleDeleteSlide = (slideIdx: number) => {
    if (carouselSlides.length <= 2) return;
    const filtered = carouselSlides.filter((_, i) => i !== slideIdx);
    const updated = filtered.map((s, i) => ({ ...s, slideNumber: i + 1, totalSlides: filtered.length }));
    updatePost({ carouselSlides: updated });
    setActiveSlideIndex(Math.max(0, slideIdx - 1));
  };

  const handleClearCarousel = () => {
    updatePost({
      carouselSlides: undefined,
      framework: 'morning-hook',
      frameworkName: 'Single Post',
    });
  };

  const handleDownloadSlideSvg = (slide: CarouselSlide) => {
    const svg = generateSvgSlide(slide, {
      authorName: 'Aryan Bansal',
      authorHandle: '@Aryanban',
      brandColor: '#6366f1',
    });
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-slide-${slide.slideNumber}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllSvgs = () => {
    carouselSlides.forEach((slide, idx) => {
      setTimeout(() => {
        handleDownloadSlideSvg(slide);
      }, idx * 150);
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Project Context & Daily Post Controls */}
      <div className="border border-brand-border bg-brand-surface rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
              Daily Algorithmic Pair
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-sans font-black text-white uppercase tracking-tight">
            Curated Posts of the Day
          </h2>
          <p className="text-xs text-zinc-400">
            Targeting: <strong className="text-white font-mono">{project.name}</strong> • 2 posts engineered for peak morning bookmark velocity and evening author-reply loops.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border font-mono text-xs">
            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'editor' ? 'bg-brand-accent text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'preview' ? 'bg-brand-accent text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Feed Preview</span>
            </button>
          </div>

          <button
            onClick={handleRegenerateBatch}
            className="px-3.5 py-2 rounded-xl border border-brand-border bg-brand-bg hover:border-zinc-600 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Regenerate Today's Pair</span>
          </button>
        </div>
      </div>

      {/* Post Selector Tabs */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          {posts.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePostIndex(idx);
                setActiveSlideIndex(0);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                activePostIndex === idx
                  ? 'bg-brand-accent text-zinc-950 shadow-[0_0_12px_rgba(163,230,53,0.3)]'
                  : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
              }`}
            >
              {p.slot === 'morning' && <Clock className="w-3.5 h-3.5" />}
              {p.slot === 'evening' && <MessageSquare className="w-3.5 h-3.5" />}
              {p.slot === 'custom' && <Sparkles className="w-3.5 h-3.5" />}
              <span>{p.frameworkName}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                activePostIndex === idx ? 'bg-zinc-950/20 text-zinc-950' : 'bg-white/5 text-zinc-400'
              }`}>
                {p.algorithmScore.netScore}
              </span>
            </button>
          ))}
        </div>

        {/* Generate More Dropdown/Buttons */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">Add Angle:</span>
            <button
              onClick={() => handleGenerateCustom('post-mortem')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-brand-border hover:border-brand-accent text-[11px] font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Post-Mortem
            </button>
            <button
              onClick={() => handleGenerateCustom('thread-hook')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-brand-border hover:border-brand-accent text-[11px] font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              5-Tweet Thread
            </button>
            <button
              onClick={() => handleGenerateCustom('linkedin-carousel')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-brand-border hover:border-indigo-400 text-[11px] font-mono text-indigo-400 hover:text-white transition-colors cursor-pointer"
            >
              LinkedIn Carousel
            </button>
            <button
              onClick={() => handleGenerateCustom('curated-tools')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-brand-border hover:border-brand-accent text-[11px] font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Curated Tools
            </button>
            <button
              onClick={() => handleGenerateCustom('reddit-story')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-brand-border hover:border-brand-indigo text-[11px] font-mono text-brand-indigo hover:text-white transition-colors cursor-pointer"
            >
              Reddit 9:1 Story
            </button>

            {backend.geminiConfigured && (
              <>
                <select
                  value={aiFramework}
                  onChange={(e) => setAiFramework(e.target.value)}
                  className="bg-brand-surface border border-emerald-500/30 rounded-lg px-2 py-1.5 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
                  title="AI framework (Gemini)"
                >
                  {AI_FRAMEWORKS.map((f) => (
                    <option key={f.id} value={f.id} className="bg-brand-surface">
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAIGenerate}
                  disabled={aiBusy}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {aiBusy ? (
                    <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  AI Generate
                </button>
              </>
            )}
          </div>

          {aiNote && (
            <span className="text-[10px] font-mono text-emerald-400 text-right">{aiNote}</span>
          )}
        </div>
      </div>

      {/* Main Studio Grid: Editor/Preview + Scorecard & Linter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Post Editor or Live Preview */}
        <div className="lg:col-span-7 space-y-6">
          {viewMode === 'preview' ? (
            <div className="space-y-4">
              <SocialPreviewCard post={currentPost} />
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleQueueClick}
                  className="px-5 py-2.5 rounded-xl bg-brand-accent text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(163,230,53,0.3)] cursor-pointer"
                >
                  {scheduledSuccessId === currentPost.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Queue</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Approve &amp; Add to Queue</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : isCarouselMode ? (
            /* --- LinkedIn Document Carousel Deck Studio (Taplio Rival) --- */
            <div className="border border-indigo-500/30 bg-brand-surface rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="text-indigo-400 font-bold uppercase tracking-wider">
                    LinkedIn Carousel Deck Studio
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-300">
                    Slide {activeSlideIndex + 1} of {carouselSlides.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadAllSvgs}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download 1080x1350 SVGs for all slides"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All SVGs</span>
                  </button>
                  <button
                    onClick={handleClearCarousel}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Revert to standard post"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slide Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {carouselSlides.map((slide, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => setActiveSlideIndex(sIdx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      activeSlideIndex === sIdx
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'bg-zinc-900 border border-brand-border text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{slide.isCover ? 'Cover' : slide.isCta ? 'Outro' : `Slide ${slide.slideNumber}`}</span>
                  </button>
                ))}
                <button
                  onClick={handleAddSlide}
                  className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-dashed border-zinc-700 hover:border-indigo-400 text-zinc-400 hover:text-indigo-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Slide</span>
                </button>
              </div>

              {/* Active Slide Editor */}
              {carouselSlides[activeSlideIndex] && (
                <div className="space-y-4 bg-zinc-950/60 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-indigo-400 font-semibold uppercase">
                      Editing {carouselSlides[activeSlideIndex].isCover ? 'Cover Slide' : carouselSlides[activeSlideIndex].isCta ? 'Outro CTA Slide' : `Content Slide #${activeSlideIndex + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadSlideSvg(carouselSlides[activeSlideIndex])}
                        className="text-[11px] font-mono text-zinc-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export SVG (1080x1350)</span>
                      </button>
                      {carouselSlides.length > 2 && (
                        <button
                          onClick={() => handleDeleteSlide(activeSlideIndex)}
                          className="text-zinc-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Delete slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                        Slide Title
                      </label>
                      <input
                        type="text"
                        value={carouselSlides[activeSlideIndex].title}
                        onChange={(e) => handleSlideTitleChange(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-white font-sans focus:outline-none focus:border-indigo-500"
                        placeholder="Slide Headline..."
                      />
                    </div>

                    {(carouselSlides[activeSlideIndex].isCover || carouselSlides[activeSlideIndex].isCta) && (
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={carouselSlides[activeSlideIndex].subtitle || ''}
                          onChange={(e) => handleSlideSubtitleChange(e.target.value)}
                          className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-zinc-300 font-sans focus:outline-none focus:border-indigo-500"
                          placeholder="Supporting subtitle..."
                        />
                      </div>
                    )}

                    {!carouselSlides[activeSlideIndex].isCover && (
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                          Bullet Points (1 per line)
                        </label>
                        <textarea
                          rows={4}
                          value={(carouselSlides[activeSlideIndex].bulletPoints || []).join('\n')}
                          onChange={(e) => handleSlidePointsChange(e.target.value)}
                          className="w-full bg-brand-bg border border-brand-border rounded-lg p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
                          placeholder="Points for this slide..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delayed 1st Comment */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-indigo"></span>
                    PART 2: LINK QUARANTINE (PINNED FIRST COMMENT)
                  </span>
                  <span className="text-[10px] text-zinc-500">Auto-sent after document</span>
                </div>
                <textarea
                  value={currentPost.replyContent || ''}
                  onChange={(e) => handleReplyChange(e.target.value)}
                  rows={2}
                  className="w-full bg-brand-bg/70 border border-brand-border rounded-xl p-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-brand-indigo leading-relaxed resize-y"
                  placeholder="URL link to avoid LinkedIn reach dampening..."
                />
              </div>

              {/* Action Bar */}
              <div className="flex justify-between items-center pt-2">
                <div className="text-[11px] font-mono text-zinc-500">
                  Platform: <strong className="text-indigo-400">LinkedIn Document</strong>
                </div>
                <button
                  onClick={handleQueueClick}
                  className="px-5 py-2.5 rounded-xl bg-brand-accent text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(163,230,53,0.3)] cursor-pointer"
                >
                  {scheduledSuccessId === currentPost.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Queue</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Add Carousel to Queue</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : isThreadMode ? (
            /* --- Typefully-Style Multi-Tweet Thread Sequencer --- */
            <div className="border border-brand-accent/30 bg-brand-surface rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-brand-accent/20 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <ListOrdered className="w-4 h-4 text-brand-accent" />
                  <span className="text-brand-accent font-bold uppercase tracking-wider">
                    Thread Sequencer (Typefully Mode)
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-300">
                    {currentPost.threadParts?.length} Connected Posts
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddThreadPart}
                    className="px-2.5 py-1.5 rounded-lg bg-brand-accent/10 border border-brand-accent/30 hover:bg-brand-accent/20 text-brand-accent text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tweet</span>
                  </button>
                  <button
                    onClick={handleClearThread}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Combine back to single post"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thread Tweet Cards */}
              <div className="space-y-4">
                {currentPost.threadParts?.map((part, pIdx) => {
                  const isOver = part.length > 280;
                  return (
                    <div
                      key={pIdx}
                      className="border border-brand-border bg-brand-bg rounded-xl p-4 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            pIdx === 0 ? 'bg-brand-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {pIdx === 0 ? 'Hook (Tweet 1)' : `Tweet ${pIdx + 1}`}
                          </span>
                          <span className="text-zinc-500">•</span>
                          <span className={`text-[11px] font-mono ${isOver ? 'text-rose-400 font-bold' : 'text-zinc-400'}`}>
                            {part.length} / 280 chars
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {pIdx > 0 && (
                            <button
                              onClick={() => handleMoveThreadPart(pIdx, 'up')}
                              className="p-1 text-zinc-500 hover:text-white cursor-pointer"
                              title="Move tweet up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {pIdx < (currentPost.threadParts?.length || 0) - 1 && (
                            <button
                              onClick={() => handleMoveThreadPart(pIdx, 'down')}
                              className="p-1 text-zinc-500 hover:text-white cursor-pointer"
                              title="Move tweet down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(currentPost.threadParts?.length || 0) > 2 && (
                            <button
                              onClick={() => handleRemoveThreadPart(pIdx)}
                              className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                              title="Delete tweet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={part}
                        onChange={(e) => handleThreadPartChange(pIdx, e.target.value)}
                        className={`w-full bg-brand-surface border rounded-lg p-3 text-xs font-mono text-zinc-100 placeholder:text-zinc-700 focus:outline-none leading-relaxed resize-y ${
                          isOver ? 'border-rose-500/80 focus:border-rose-500' : 'border-brand-border focus:border-brand-accent'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Delayed 1st Reply */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-indigo"></span>
                    PART 2: DELAYED 1ST REPLY (LINK QUARANTINE)
                  </span>
                  <span className="text-[10px] text-zinc-500">Auto-sent 15m after tweet</span>
                </div>
                <textarea
                  value={currentPost.replyContent || ''}
                  onChange={(e) => handleReplyChange(e.target.value)}
                  rows={2}
                  className="w-full bg-brand-bg/70 border border-brand-border rounded-xl p-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-brand-indigo leading-relaxed resize-y"
                  placeholder="Keep your project URL here to bypass the 50% link penalty..."
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                <div className="text-[11px] font-mono text-zinc-500">
                  Algorithm Score: <strong className="text-brand-accent">{currentPost.algorithmScore.netScore}/100 Safe</strong>
                </div>

                <button
                  onClick={handleQueueClick}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-accent text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(163,230,53,0.3)] cursor-pointer"
                >
                  {scheduledSuccessId === currentPost.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Queue</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Add Thread to Queue</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* --- Standard Single Post Editor --- */
            <div className="border border-brand-border bg-brand-surface rounded-2xl p-6 space-y-4">
              {/* Header with Tools */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-brand-accent font-bold uppercase">
                    PART 1: ROOT POST
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400">
                    {currentPost.mainContent.length} / {currentPost.platform === 'reddit' ? 40000 : currentPost.platform === 'linkedin' ? 3000 : 280} chars
                  </span>
                </div>

                {/* Conversion Tools: Split Thread & Create Carousel */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSplitThread}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-brand-border hover:border-brand-accent text-[11px] font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Split long post into numbered thread (Typefully style)"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-brand-accent" />
                    <span>Split Thread</span>
                  </button>

                  <button
                    onClick={handleCreateCarousel}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-brand-border hover:border-indigo-400 text-[11px] font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Turn into LinkedIn Carousel Slide Deck (Taplio style)"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Make Carousel</span>
                  </button>
                </div>
              </div>

              {/* Editable Root Post */}
              <textarea
                value={currentPost.mainContent}
                onChange={(e) => handleContentChange(e.target.value)}
                rows={8}
                className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-sm font-mono text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent leading-relaxed resize-y"
                placeholder="Draft your post here..."
              />

              {/* 2-Step Link Strategy: Delayed 1st Reply */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-indigo"></span>
                    PART 2: DELAYED 1ST REPLY (LINK QUARANTINE)
                  </span>
                  <span className="text-[10px] text-zinc-500">Auto-sent 15m after tweet</span>
                </div>
                <textarea
                  value={currentPost.replyContent || ''}
                  onChange={(e) => handleReplyChange(e.target.value)}
                  rows={3}
                  className="w-full bg-brand-bg/70 border border-brand-border rounded-xl p-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-brand-indigo leading-relaxed resize-y"
                  placeholder="Keep your project URL here to bypass the 50% link penalty..."
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-white/5">
                <div className="text-[11px] font-mono text-zinc-500">
                  Algorithm Verdict: <strong className="text-brand-accent">{currentPost.algorithmScore.netScore}/100 Safe</strong>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleQueueClick}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-accent text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(163,230,53,0.3)] cursor-pointer"
                  >
                    {scheduledSuccessId === currentPost.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Queue</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Add to Queue</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Heavy Ranker Scorecard & Anti-Shadowban Linter */}
        <div className="lg:col-span-5 space-y-6">
          <AlgorithmScorecard 
            metrics={currentPost.algorithmScore} 
            whyAlgorithmLikes={currentPost.whyAlgorithmLikes}
          />

          <ShadowbanInspector 
            checks={currentPost.linterChecks}
            onAutoFix={handleAutoFix}
            hasFixableIssues={currentPost.linterChecks.some(c => c.fixable && c.severity !== 'pass')}
          />
        </div>
      </div>
    </div>
  );
};
