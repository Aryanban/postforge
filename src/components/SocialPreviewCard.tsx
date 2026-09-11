import React from 'react';
import { PostItem } from '../types';
import { 
  Heart, 
  Repeat2, 
  MessageCircle, 
  Bookmark, 
  Share, 
  BadgeCheck, 
  ArrowBigUp, 
  ArrowBigDown, 
  ExternalLink 
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
  // Scale engagement metrics realistically based on Heavy Ranker net score
  const score = post.algorithmScore.netScore;
  const estimatedViews = Math.round((score / 100) * 14500 + 1200);
  const estimatedLikes = Math.round((score / 100) * 420 + 35);
  const estimatedRetweets = Math.round((score / 100) * 88 + 8);
  const estimatedReplies = Math.round((score / 100) * 54 + 5);
  const estimatedBookmarks = Math.round((score / 100) * 210 + 15);

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

            <div className="text-zinc-300 font-body leading-relaxed whitespace-pre-wrap text-xs bg-black/20 p-3 rounded-xl border border-white/5">
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
          </div>

          <div className="text-zinc-100 text-sm font-sans leading-relaxed whitespace-pre-wrap font-normal">
            {post.mainContent}
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

      {/* Quarantined 1st Reply (Thread line preview) */}
      {post.replyContent && (
        <div className="pl-5 pt-2 relative before:absolute before:left-[29px] before:top-0 before:bottom-3 before:w-[2px] before:bg-zinc-800">
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex gap-3 ml-4">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-brand-accent text-xs font-mono shrink-0">
              AB
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="font-bold text-white">{authorName}</span>
                <span className="text-zinc-500">@{authorHandle}</span>
                <span className="text-[10px] text-brand-accent bg-brand-accent/10 px-1.5 py-0.2 rounded">15m later</span>
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
