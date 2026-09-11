import React from 'react';
import { HeavyRankerMetrics } from '../types';
import { 
  Zap, 
  Clock, 
  MessageSquare, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface AlgorithmScorecardProps {
  metrics: HeavyRankerMetrics;
  whyAlgorithmLikes?: string;
}

export const AlgorithmScorecard: React.FC<AlgorithmScorecardProps> = ({
  metrics,
  whyAlgorithmLikes,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-brand-accent border-brand-accent/40 bg-brand-accent/10';
    if (score >= 65) return 'text-amber-400 border-amber-400/40 bg-amber-400/10';
    return 'text-red-400 border-red-400/40 bg-red-400/10';
  };

  return (
    <div className="border border-brand-border bg-brand-surface-card rounded-2xl p-5 space-y-5">
      {/* Header Metric */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
            HEAVY RANKER EVALUATION
          </span>
          <h4 className="text-base font-sans font-bold text-white flex items-center gap-2 mt-0.5">
            <Zap className="w-4 h-4 text-brand-accent" />
            Algorithmic Distribution Score
          </h4>
        </div>

        <div className={`px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${getScoreColor(metrics.netScore)}`}>
          {metrics.netScore} / 100
        </div>
      </div>

      {/* Grid of Key Factors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        {/* Estimated Multiplier */}
        <div className="p-3 rounded-xl border border-brand-border bg-brand-bg space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-brand-accent" /> Reach Est.
          </div>
          <div className="text-base font-bold text-white">
            {metrics.impressionMultiplierEst}x
          </div>
          <div className="text-[10px] text-brand-accent">vs baseline post</div>
        </div>

        {/* Reply Incentive */}
        <div className="p-3 rounded-xl border border-brand-border bg-brand-bg space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-brand-indigo" /> Reply Weight
          </div>
          <div className="text-base font-bold text-white">
            {metrics.replyMultiplier}x
          </div>
          <div className="text-[10px] text-zinc-400">Author-reply boost</div>
        </div>

        {/* Dwell Time */}
        <div className="p-3 rounded-xl border border-brand-border bg-brand-bg space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" /> Dwell Index
          </div>
          <div className="text-base font-bold text-white">
            ~{metrics.dwellTimeSeconds}s
          </div>
          <div className="text-[10px] text-emerald-400">High visual pause</div>
        </div>

        {/* Link Penalty Check */}
        <div className="p-3 rounded-xl border border-brand-border bg-brand-bg space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-zinc-400" /> Link Penalty
          </div>
          <div className="text-xs font-bold pt-1">
            {metrics.rootLinkPenalty ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> -50% Throttled
              </span>
            ) : (
              <span className="text-brand-accent flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 0% Penalty (Safe)
              </span>
            )}
          </div>
          <div className="text-[10px] text-zinc-500">
            {metrics.rootLinkPenalty ? 'URL in root tweet' : 'Quarantined in reply'}
          </div>
        </div>
      </div>

      {/* Why Algorithm Likes This */}
      {whyAlgorithmLikes && (
        <div className="bg-brand-bg/70 border border-white/5 rounded-xl p-3.5 text-xs space-y-1 font-body">
          <span className="text-[10px] uppercase font-mono font-bold text-brand-accent tracking-wider block">
            Algorithmic Recommendation Logic:
          </span>
          <p className="text-zinc-300 leading-relaxed">
            {whyAlgorithmLikes}
          </p>
        </div>
      )}
    </div>
  );
};
