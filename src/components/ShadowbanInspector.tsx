import React from 'react';
import { ShadowbanCheck } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Wand2 
} from 'lucide-react';

interface ShadowbanInspectorProps {
  checks: ShadowbanCheck[];
  onAutoFix?: () => void;
  hasFixableIssues: boolean;
}

export const ShadowbanInspector: React.FC<ShadowbanInspectorProps> = ({
  checks,
  onAutoFix,
  hasFixableIssues,
}) => {
  const criticalCount = checks.filter(c => c.severity === 'critical').length;
  const warningCount = checks.filter(c => c.severity === 'warning').length;

  return (
    <div className="border border-brand-border bg-brand-surface rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          {criticalCount > 0 ? (
            <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-sans font-bold text-white uppercase tracking-wider">
              Pre-Flight Anti-Shadowban Linter
            </h4>
            <p className="text-[11px] text-zinc-400 font-mono">
              {criticalCount === 0 && warningCount === 0 
                ? 'All 6 anti-shadowban heuristics passed. Nominal.' 
                : `${criticalCount} critical penalty risk(s), ${warningCount} warning(s)`}
            </p>
          </div>
        </div>

        {hasFixableIssues && onAutoFix && (
          <button
            onClick={onAutoFix}
            className="px-3 py-1.5 rounded-xl bg-brand-accent text-zinc-950 text-xs font-mono font-bold uppercase hover:bg-brand-accent/90 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(163,230,53,0.3)] cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Auto-Fix for Algorithm</span>
          </button>
        )}
      </div>

      {/* Checks list */}
      <div className="space-y-2 text-xs">
        {checks.map((check) => (
          <div 
            key={check.id}
            className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
              check.severity === 'critical'
                ? 'bg-red-500/5 border-red-500/20 text-red-300'
                : check.severity === 'warning'
                ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                : 'bg-brand-bg border-brand-border text-zinc-300'
            }`}
          >
            {check.severity === 'critical' ? (
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            ) : check.severity === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
            )}

            <div className="space-y-0.5 flex-grow">
              <div className="font-semibold text-white flex items-center justify-between">
                <span>{check.title}</span>
                <span className="text-[10px] font-mono uppercase opacity-70">
                  {check.severity}
                </span>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                {check.details}
              </p>
              {check.fixDescription && (
                <p className="text-[10px] text-brand-accent font-mono pt-1">
                  &gt; Recommended Fix: {check.fixDescription}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
