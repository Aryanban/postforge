import React, { useState } from 'react';
import { PostItem, generateCarouselDeck, CarouselSlide } from '@postforge/core';
import { 
  Heart, 
  Repeat2, 
  MessageCircle, 
  Bookmark, 
  Share, 
  BadgeCheck, 
  ArrowBigUp, 
  ArrowBigDown, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  Layers
} from 'lucide-react';

interface SocialPreviewCardProps {
  post: PostItem;
  authorName?: string;
  authorHandle?: string;
}

export const SocialPreviewCard: React.FC<SocialPreviewCardProps> = ({
  post,
  authorName = 'Aryan Bansal',
  authorHandle = 'Aryanban',
}) => {
  const [expandedLinkedIn, setExpandedLinkedIn] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Scale engagement metrics realistically based on Heavy Ranker net score
  const score = post.algorithmScore?.netScore ?? 75;
  const estimatedLikes = Math.round((score / 100) * 420 + 35);
  const estimatedRetweets = Math.round((score / 100) * 88 + 8);
  const estimatedReplies = Math.round((score / 100) * 54 + 5);
  const estimatedBookmarks = Math.round((score / 100) * 210 + 15);

  // Reddit Simulation
  if (post.platform === 'reddit') {
    return (
      <div className="border border-brand-border bg-[#1a1a1b] rounded-2xl overflow-hidden shadow-2xl font-sans text-xs">
        <div className="flex">
          {/* Left Upvote Bar */}
          <div className="w-10 bg-[#151516] flex flex-col items-center py-3 gap-1 border-r border-white/5 shrink-0 select-none">
            <ArrowBigUp className="w-5 h-5 text-zinc-500 hover:text-orange-500 cursor-pointer" />
            <span className="font-bold text-zinc-300 font-mono text-[11px]">
              {Math.round((score / 100) * 180 + 25)}
            </span>
            <ArrowBigDown className="w-5 h-5 text-zinc-500 hover:text-indigo-500 cursor-pointer" />
          </div>

          {/* Right Content */}
          <div className="p-4 space-y-3 flex-grow">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
              <span className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-[9px]">
                r/
              </span>
              <span className="font-bold text-white">{post.subreddit || 'r/SideProject'}</span>
              <span>&bull;</span>
              <span>Posted by u/{authorHandle}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-zinc-300">
                [Showcase]
              </span>
            </div>

            <h3 className="text-base font-bold text-white leading-snug">
              {post.hook}
            </h3>

            <div className="text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap text-xs bg-black/20 p-3 rounded-xl border border-white/5">
              {post.mainContent}
            </div>

            {post.replyContent && (
              <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-brand-indigo font-mono">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>OP Comment Link: {post.replyContent.split('\n')[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LinkedIn Simulation
  if (post.platform === 'linkedin') {
    const isCarousel = post.framework === 'linkedin-carousel';
    const slides: CarouselSlide[] = isCarousel
      ? generateCarouselDeck(post.mainContent, { authorName, authorHandle })
      : [];

    const shouldTruncate = post.mainContent.length > 160 && !expandedLinkedIn;
    const displayedContent = shouldTruncate
      ? post.mainContent.slice(0, 160) + '...'
      : post.mainContent;

    return (
      <div className="border border-brand-border bg-[#1b1f23] rounded-2xl p-5 shadow-2xl font-sans text-xs space-y-4 text-zinc-200">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            LINKEDIN FEED SIMULATION
          </span>
          <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
            Dwell Score: {post.algorithmScore?.dwellTimeSeconds || 45}s
          </span>
        </div>

        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {authorName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-white text-sm">
                <span>{authorName}</span>
                <span className="text-[11px] text-zinc-400 font-normal">&bull; 1st</span>
              </div>
              <div className="text-[11px] text-zinc-400 truncate max-w-[260px]">
                Founder & Systems Architect • Building Open Source
              </div>
              <div className="text-[10px] text-zinc-500">1h &bull; Edited &bull; 🌐</div>
            </div>
          </div>
          <button className="text-sky-400 hover:text-sky-300 font-bold text-xs flex items-center gap-1 px-3 py-1 rounded-full border border-sky-500/30 hover:bg-sky-500/10 transition-colors">
            + Follow
          </button>
        </div>

        {/* Post Text with ...see more fold */}
        <div className="text-zinc-100 text-xs leading-relaxed whitespace-pre-wrap font-sans">
          {displayedContent}
          {shouldTruncate && (
            <button
              onClick={() => setExpandedLinkedIn(true)}
              className="text-zinc-400 hover:text-white font-semibold ml-1 cursor-pointer"
            >
              ...see more
            </button>
          )}
        </div>

        {/* LinkedIn Document Carousel Viewer (Taplio rival) */}
        {isCarousel && slides.length > 0 && (
          <div className="bg-[#121417] border border-white/10 rounded-xl overflow-hidden shadow-inner space-y-2">
            <div className="p-3 bg-zinc-900 border-b border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Document Carousel ({slides.length} slides)</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
                Slide {activeSlide + 1} of {slides.length}
              </span>
            </div>

            {/* Active Slide Display */}
            <div className="p-6 min-h-[200px] flex flex-col justify-between bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 relative">
              <div className="space-y-3">
                <h4 className="text-base font-bold text-white leading-snug">
                  {slides[activeSlide]?.title}
                </h4>
                {slides[activeSlide]?.subtitle && (
                  <p className="text-xs text-zinc-400 italic">
                    {slides[activeSlide].subtitle}
                  </p>
                )}
                {slides[activeSlide]?.bulletPoints && (
                  <ul className="space-y-1.5 pt-1">
                    {slides[activeSlide].bulletPoints!.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Slide Nav buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={() => setActiveSlide((s) => Math.max(0, s - 1))}
                  disabled={activeSlide === 0}
                  className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex gap-1">
                  {slides.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        activeSlide === i ? 'w-4 bg-indigo-500' : 'w-1.5 bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveSlide((s) => Math.min(slides.length - 1, s + 1))}
                  disabled={activeSlide === slides.length - 1}
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quarantined 1st Reply */}
        {post.replyContent && (
          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1 text-xs">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide">
              Author First Comment (Pinned):
            </div>
            <div className="text-zinc-300 text-xs whitespace-pre-wrap leading-relaxed">
              {post.replyContent}
            </div>
          </div>
        )}

        {/* Social Metrics & Reaction Bar */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1">
              <span className="flex -space-x-1">
                <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white">👍</span>
                <span className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-[9px] text-white">💡</span>
                <span className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center text-[9px] text-white">❤️</span>
              </span>
              <span className="ml-1 font-medium text-zinc-300">{estimatedLikes}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{estimatedReplies} comments</span>
              <span>&bull;</span>
              <span>{estimatedRetweets} reposts</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-1 border-t border-white/5 text-zinc-400 text-center font-semibold text-xs">
            <button className="py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-1.5 hover:text-white">
              <ThumbsUp className="w-3.5 h-3.5" /> Like
            </button>
            <button className="py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-1.5 hover:text-white">
              <MessageCircle className="w-3.5 h-3.5" /> Comment
            </button>
            <button className="py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-1.5 hover:text-white">
              <Repeat2 className="w-3.5 h-3.5" /> Repost
            </button>
            <button className="py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-1.5 hover:text-white">
              <Share className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: X / Twitter Simulation
  return (
    <div className="border border-brand-border bg-black rounded-2xl p-5 shadow-2xl font-sans text-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          X / TWITTER FEED SIMULATION
        </span>
        <span className="text-[10px] font-mono text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded border border-brand-accent/20">
          Ranker Velocity: {post.algorithmScore.impressionMultiplierEst}x
        </span>
      </div>

      {/* Tweet Body */}
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-brand-accent font-bold font-mono text-sm shrink-0">
          AB
        </div>

        {/* Content Column */}
        <div className="space-y-2 flex-grow">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white text-sm">{authorName}</span>
            <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20" />
            <span className="text-zinc-500 font-mono text-xs">@{authorHandle}</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-500 font-mono text-[11px]">Just now</span>
            {post.threadParts && post.threadParts.length > 1 && (
              <span className="ml-auto text-[10px] font-mono text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded border border-brand-accent/30 font-semibold">
                Thread: 1 / {post.threadParts.length}
              </span>
            )}
          </div>

          <div className="text-zinc-100 text-sm font-sans leading-relaxed whitespace-pre-wrap font-normal">
            {post.threadParts && post.threadParts.length > 1 ? post.threadParts[0] : post.mainContent}
          </div>

          {/* Social Action Metrics */}
          <div className="flex items-center justify-between text-zinc-500 pt-3 border-t border-zinc-800/80 max-w-md font-mono text-xs">
            <div className="flex items-center gap-1.5 hover:text-sky-400 cursor-pointer transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>{estimatedReplies}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-emerald-400 cursor-pointer transition-colors">
              <Repeat2 className="w-4 h-4" />
              <span>{estimatedRetweets}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-pink-500 cursor-pointer transition-colors">
              <Heart className="w-4 h-4" />
              <span>{estimatedLikes}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-brand-accent cursor-pointer transition-colors">
              <Bookmark className="w-4 h-4" />
              <span>{estimatedBookmarks}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
              <Share className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Chained Thread Parts (2..N) */}
      {post.threadParts && post.threadParts.length > 1 && post.threadParts.slice(1).map((part, pIdx) => (
        <div key={pIdx} className="pl-5 pt-2 relative before:absolute before:left-[19px] before:top-[-12px] before:bottom-3 before:w-[2px] before:bg-zinc-800">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-brand-accent font-bold font-mono text-xs shrink-0">
              AB
            </div>
            <div className="space-y-1.5 flex-grow">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs">{authorName}</span>
                <span className="text-zinc-500 font-mono text-[11px]">@{authorHandle}</span>
                <span className="ml-auto text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                  {pIdx + 2} / {post.threadParts!.length}
                </span>
              </div>
              <div className="text-zinc-200 text-xs font-sans leading-relaxed whitespace-pre-wrap bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
                {part}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Quarantined 1st Reply (Thread line preview) */}
      {post.replyContent && (
        <div className={`pl-5 pt-2 relative ${post.threadParts && post.threadParts.length > 1 ? 'before:absolute before:left-[19px] before:top-[-10px] before:bottom-3 before:w-[2px] before:bg-zinc-800' : 'before:absolute before:left-[29px] before:top-0 before:bottom-3 before:w-[2px] before:bg-zinc-800'}`}>
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex gap-3 ml-2">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-brand-accent text-xs font-mono shrink-0">
              AB
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="font-bold text-white">{authorName}</span>
                <span className="text-zinc-500">@{authorHandle}</span>
                <span className="text-[10px] text-brand-accent bg-brand-accent/10 px-1.5 py-0.2 rounded">15m later (delayed link)</span>
              </div>
              <div className="text-zinc-300 font-mono text-xs whitespace-pre-wrap leading-snug">
                {post.replyContent}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
