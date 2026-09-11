import React, { useState } from 'react';
import { PostItem } from '../types';
import { 
  Calendar, 
  Clock, 
  Send, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

interface ScheduleQueueProps {
  posts: PostItem[];
  onRemovePost: (id: string) => void;
  onUpdateStatus: (id: string, status: PostItem['status']) => void;
  hasApiKeys: boolean;
}

export const ScheduleQueue: React.FC<ScheduleQueueProps> = ({
  posts,
  onRemovePost,
  onUpdateStatus,
  hasApiKeys,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Launch native X Intent (100% free / no API key needed!)
  const launchNativeXIntent = (post: PostItem) => {
    const textToTweet = encodeURIComponent(post.mainContent);
    const intentUrl = `https://twitter.com/intent/tweet?text=${textToTweet}`;
    window.open(intentUrl, '_blank');
    onUpdateStatus(post.id, 'published');
  };

  // Launch Reddit submit
  const launchRedditSubmit = (post: PostItem) => {
    const sub = post.subreddit || 'SideProject';
    const title = encodeURIComponent(post.hook);
    const body = encodeURIComponent(post.mainContent);
    const url = `https://www.reddit.com/r/${sub}/submit?title=${title}&text=${body}`;
    window.open(url, '_blank');
    onUpdateStatus(post.id, 'published');
  };

  if (posts.length === 0) {
    return (
      <div className="border border-brand-border bg-brand-surface rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto text-zinc-500">
          <Calendar className="w-6 h-6" />
        </div>
        <h4 className="text-base font-sans font-bold text-white uppercase">Queue Empty</h4>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Add the generated Morning Velocity or Evening Debate posts to your queue to activate algorithmic jitter scheduling.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-brand-border bg-brand-surface rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-brand-accent block">
            TIMING &amp; DISPATCH ENGINE
          </span>
          <h3 className="text-xl font-sans font-bold text-white uppercase tracking-tight flex items-center gap-2 mt-0.5">
            <Calendar className="w-5 h-5 text-brand-accent" />
            Scheduled Queue ({posts.length} Active Posts)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Every scheduled time includes randomized anti-bot jitter (±4 to 18 mins) to avoid platform automation flags.
          </p>
        </div>

        <div className="px-3 py-1 rounded-full border border-white/10 bg-brand-bg text-[11px] font-mono text-zinc-400">
          Mode: <span className={hasApiKeys ? 'text-emerald-400 font-bold' : 'text-brand-accent font-bold'}>
            {hasApiKeys ? 'Direct API Automated' : '1-Click Native Intent (Zero-Cost)'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const formattedDate = new Date(post.scheduledDate).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div 
              key={post.id}
              className="p-5 rounded-xl border border-brand-border bg-brand-bg space-y-4 transition-all hover:border-zinc-700"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                    post.platform === 'x' 
                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' 
                      : 'bg-brand-indigo/15 text-brand-indigo border border-brand-indigo/30'
                  }`}>
                    {post.platform.toUpperCase()} • {post.frameworkName}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    Slot: {post.slot.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-brand-accent">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                  <span className="text-[10px] text-zinc-500">(+{post.jitterMinutes}m jitter)</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-white/5">
                {post.mainContent}
              </div>

              {/* 2-Step Reply Link */}
              {post.replyContent && (
                <div className="bg-brand-surface p-3.5 rounded-xl border border-brand-border/60 text-xs font-mono space-y-1">
                  <span className="text-[10px] uppercase font-bold text-brand-accent block">
                    Part 2 (Delayed 1st Reply with URL):
                  </span>
                  <p className="text-zinc-400 whitespace-pre-wrap">
                    {post.replyContent}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(post.mainContent, post.id)}
                    className="px-3 py-1.5 rounded-lg border border-brand-border hover:bg-zinc-800 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedId === post.id ? (
                      <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>
                    ) : (
                      <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy Text</span>
                    )}
                  </button>

                  <button
                    onClick={() => onRemovePost(post.id)}
                    title="Remove from queue"
                    className="p-1.5 rounded-lg border border-brand-border hover:border-red-500/40 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Dispatch Trigger */}
                <div className="flex items-center gap-2">
                  {post.platform === 'x' ? (
                    <button
                      onClick={() => launchNativeXIntent(post)}
                      className="px-4 py-2 rounded-xl bg-brand-accent text-zinc-950 text-xs font-mono font-bold uppercase hover:bg-brand-accent/90 transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(163,230,53,0.25)] cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Launch in X (1-Click)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => launchRedditSubmit(post)}
                      className="px-4 py-2 rounded-xl bg-brand-indigo text-white text-xs font-mono font-bold uppercase hover:bg-brand-indigo/90 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Submit to {post.subreddit || 'Reddit'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
