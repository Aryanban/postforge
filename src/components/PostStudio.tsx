import React, { useState } from 'react';
import { ProjectProfile, PostItem } from '../types';
import { calculateHeavyRankerScore } from '../lib/algorithm/heavyRanker';
import { lintPostContent, autoFixForAlgorithm } from '../lib/algorithm/shadowbanLinter';
import { generateDailyPostBatch, generateCustomAngle } from '../lib/generators/promptTemplates';
import { AlgorithmScorecard } from './AlgorithmScorecard';
import { ShadowbanInspector } from './ShadowbanInspector';
import { SocialPreviewCard } from './SocialPreviewCard';
import { 
  Sparkles, 
  Send, 
  Calendar, 
  RotateCw, 
  Wand2, 
  Check, 
  Layers, 
  Clock, 
  MessageSquare,
  Plus,
  Eye,
  Edit3
} from 'lucide-react';

interface PostStudioProps {
  project: ProjectProfile;
  onSchedulePost: (post: PostItem) => void;
}

export const PostStudio: React.FC<PostStudioProps> = ({
  project,
  onSchedulePost,
}) => {
  const [posts, setPosts] = useState<PostItem[]>(() => generateDailyPostBatch(project));
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [scheduledSuccessId, setScheduledSuccessId] = useState<string | null>(null);

  const currentPost = posts[activePostIndex] || posts[0];

  // Recalculate on manual edit
  const handleContentChange = (newContent: string) => {
    const updatedScore = calculateHeavyRankerScore(newContent, currentPost.replyContent);
    const updatedLints = lintPostContent(newContent, currentPost.replyContent);

    const updatedPosts = [...posts];
    updatedPosts[activePostIndex] = {
      ...currentPost,
      mainContent: newContent,
      algorithmScore: updatedScore,
      linterChecks: updatedLints.checks,
    };
    setPosts(updatedPosts);
  };

  const handleReplyChange = (newReply: string) => {
    const updatedScore = calculateHeavyRankerScore(currentPost.mainContent, newReply);
    const updatedLints = lintPostContent(currentPost.mainContent, newReply);

    const updatedPosts = [...posts];
    updatedPosts[activePostIndex] = {
      ...currentPost,
      replyContent: newReply,
      algorithmScore: updatedScore,
      linterChecks: updatedLints.checks,
    };
    setPosts(updatedPosts);
  };

  const handleAutoFix = () => {
    const { fixedContent, replyContent } = autoFixForAlgorithm(currentPost.mainContent);
    const effectiveReply = currentPost.replyContent || replyContent;

    const updatedScore = calculateHeavyRankerScore(fixedContent, effectiveReply);
    const updatedLints = lintPostContent(fixedContent, effectiveReply);

    const updatedPosts = [...posts];
    updatedPosts[activePostIndex] = {
      ...currentPost,
      mainContent: fixedContent,
      replyContent: effectiveReply,
      algorithmScore: updatedScore,
      linterChecks: updatedLints.checks,
    };
    setPosts(updatedPosts);
  };

  const handleRegenerateBatch = () => {
    const newBatch = generateDailyPostBatch(project);
    setPosts(newBatch);
    setActivePostIndex(0);
  };

  const handleGenerateCustom = (framework: string) => {
    const newPost = generateCustomAngle(project, framework);
    setPosts(prev => [newPost, ...prev]);
    setActivePostIndex(0);
  };

  const handleQueueClick = () => {
    onSchedulePost(currentPost);
    setScheduledSuccessId(currentPost.id);
    setTimeout(() => setScheduledSuccessId(null), 2500);
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
        <div className="flex items-center gap-2 shrink-0">
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
                    {currentPost.mainContent.length} / 280 chars
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
