import React from 'react';
import { ProjectProfile } from '../types';
import { 
  Cpu, 
  Key, 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  ExternalLink 
} from 'lucide-react';

interface NavbarProps {
  projects: ProjectProfile[];
  activeProject: ProjectProfile;
  onSelectProject: (project: ProjectProfile) => void;
  onOpenNewProject: () => void;
  onOpenApiModal: () => void;
  hasApiKeys: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProject,
  onOpenApiModal,
  hasApiKeys,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-brand-bg/85 backdrop-blur-lg px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Logo & Platform Tag */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center text-brand-accent shadow-[0_0_12px_rgba(163,230,53,0.2)]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-black text-lg text-white tracking-tight">POSTFORGE</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-semibold">
                ALGO ENGINE v2.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono hidden sm:block">
              Heavy Ranker Optimization • Anti-Shadowban Guardrail
            </p>
          </div>
        </div>

        {/* Center: Active Project Selector */}
        <div className="flex items-center gap-2 bg-brand-surface border border-brand-border px-3 py-1.5 rounded-xl text-xs font-mono">
          <Globe className="w-3.5 h-3.5 text-brand-accent" />
          <span className="text-zinc-500">Target:</span>
          <select 
            value={activeProject.id}
            onChange={(e) => {
              const selected = projects.find(p => p.id === e.target.value);
              if (selected) onSelectProject(selected);
            }}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} className="bg-brand-surface text-white">
                {p.domain}
              </option>
            ))}
          </select>
          <button
            onClick={onOpenNewProject}
            title="Ingest new domain or repo"
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Actions: API Status & Keys Modal */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-brand-surface text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />
            <span className="text-zinc-400">Ruleset:</span>
            <span className="text-brand-accent font-semibold">twitter/the-algorithm</span>
          </div>

          <button
            onClick={onOpenApiModal}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
              hasApiKeys 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-brand-surface border-brand-border text-zinc-300 hover:border-brand-accent/40 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKeys ? 'API Vault (Active)' : 'Setup API Keys'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
