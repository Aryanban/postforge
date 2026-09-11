import React from 'react';
import { ProjectProfile } from '../types';
import { MessageSquare, ShieldAlert, Sparkles, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';

interface RedditStrategistProps {
  project: ProjectProfile;
  onGenerateRedditPost: () => void;
}

export const RedditStrategist: React.FC<RedditStrategistProps> = ({
  project,
  onGenerateRedditPost,
}) => {
  return (
    <div className="border border-brand-border bg-brand-surface rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-brand-indigo block">
            COMMUNITY ALGORITHM MATRIX
          </span>
          <h3 className="text-xl font-sans font-bold text-white uppercase tracking-tight flex items-center gap-2 mt-0.5">
            <MessageSquare className="w-5 h-5 text-brand-indigo" />
            Reddit Growth &amp; 9:1 Compliance Strategist
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Reddit's AutoMod and spam filters instantly shadowban direct sales copy. We structure posts as engineering post-mortems and community value drops.
          </p>
        </div>

        <button
          onClick={onGenerateRedditPost}
          className="px-4 py-2 rounded-xl bg-brand-indigo text-white text-xs font-mono font-bold uppercase hover:bg-brand-indigo/90 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate 9:1 Story</span>
        </button>
      </div>

      {/* 9:1 Rule Visual Meter */}
      <div className="p-4 rounded-xl border border-brand-border bg-brand-bg space-y-3">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-300 font-semibold">Reddit 9:1 Self-Promotion Compliance</span>
          <span className="text-brand-accent font-bold">100% Safe (0% Direct Ad Pitch)</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-white/5 overflow-hidden flex">
          <div className="bg-brand-accent h-full w-[90%]" title="90% Engineering Value & Story"></div>
          <div className="bg-brand-indigo h-full w-[10%]" title="10% Open Source Link Drop"></div>
        </div>
        <div className="flex justify-between text-[11px] font-mono text-zinc-500">
          <span>90% Engineering Lessons &amp; Failures</span>
          <span>10% Open-Source Code Link</span>
        </div>
      </div>

      {/* Recommended Subreddits */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase font-bold text-zinc-400">
          Targeted Subreddits for {project.name}:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {project.recommendedSubreddits.map((sub) => (
            <div 
              key={sub}
              className="p-3 rounded-xl border border-brand-border bg-brand-bg/60 hover:border-brand-indigo/40 transition-colors flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-bold text-white group-hover:text-brand-indigo transition-colors">
                  {sub}
                </span>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {sub === 'r/webdev' && 'Showoff Saturday rules apply'}
                  {sub === 'r/SideProject' && 'Highlight solo-dev journey'}
                  {sub === 'r/reactjs' && 'Focus on React 19 architecture'}
                  {sub === 'r/opensource' && 'Link directly to GitHub repo'}
                  {!['r/webdev', 'r/SideProject', 'r/reactjs', 'r/opensource'].includes(sub) && 'Tech community discussion'}
                </p>
              </div>
              <a 
                href={`https://reddit.com/${sub}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-zinc-600 hover:text-white p-1"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* AutoMod Bypass Protocol */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-xl border border-white/5 bg-brand-bg/40 space-y-1">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> AutoMod Safe Guidelines:
          </span>
          <ul className="text-zinc-400 text-[11px] space-y-1 pl-4 list-disc pt-1">
            <li>Prefix title with appropriate tags like [Showcase] or [Project]</li>
            <li>Put technical architecture upfront in plain markdown</li>
            <li>No shortened links (bit.ly/t.co) — use full transparent URLs</li>
          </ul>
        </div>

        <div className="p-3.5 rounded-xl border border-white/5 bg-brand-bg/40 space-y-1">
          <span className="text-red-400 font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Instant Removal Triggers:
          </span>
          <ul className="text-zinc-400 text-[11px] space-y-1 pl-4 list-disc pt-1">
            <li>Marketing superlatives ("The best tool in 2026")</li>
            <li>Asking for upvotes or comment engagement</li>
            <li>Posting identical copy to 3+ subreddits within 1 hour</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
