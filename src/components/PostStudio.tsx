import React, { useState } from 'react';
import { ProjectProfile, PostItem } from '@postforge/core';
import { calculateHeavyRankerScore } from '@postforge/core';
import { lintPostContent, autoFixForAlgorithm } from '@postforge/core';
import { generateDailyPostBatch, generateCustomAngle, AI_FRAMEWORKS, extractProjectKeywords } from '@postforge/core';
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
  Edit3
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

  const currentPost = posts[activePostIndex] || posts[0];

  // Live scoring uses the project's real vocabulary for SimCluster alignment.
  const scoreContext = () => ({
    keywords: extractProjectKeywords(project),
    platform: currentPost.platform,
  });

  // Recalculate on manual edit. One helper replaces three near-identical
  // handlers: re-score, re-lint, and splice the active post in place.
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
        return;
      } catch {
        /* fall through to local generation */
      }
    }
    setPosts(generateDailyPostBatch(project));
    setActivePostIndex(0);
  };

  const handleGenerateCustom = async (framework: string) => {
    if (backend.available) {
      try {
        const batch = await api.generate(project.id, framework);
        setPosts(prev => [...batch, ...prev]);
        setActivePostIndex(0);
        return;
      } catch {
        /* fall through to local generation */
      }
    }
    setPosts(prev => [generateCustomAngle(project, framework), ...prev]);
    setActivePostIndex(0);
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
      setAiNote(
        `${result.accepted ? 'AI draft accepted' : `Best of ${result.rounds} rounds`} — score ${result.post.algorithmScore.netScore}/100 after ${result.rounds} round${result.rounds > 1 ? 's' : ''}.`
      );
    } catch (err) {
      setAiNote(`AI generation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAiBusy(false);
    }
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
              onClick={() => setActivePostIndex(idx)}
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
          ) : (
            <div className="border border-brand-border bg-brand-surface rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-brand-accent font-bold uppercase">
                    PART 1: ROOT POST
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400">
                    {currentPost.mainContent.length} / {currentPost.platform === 'reddit' ? 40000 : currentPost.platform === 'linkedin' ? 3000 : 280} chars
                  </span>
                </div>

                <div className="text-[11px] font-mono text-zinc-500">
                  Scheduled: <span className="text-brand-accent">{new Date(currentPost.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {' '}(+{currentPost.jitterMinutes}m jitter)
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
