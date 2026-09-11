import React, { useState } from 'react';
import { ProjectProfile } from '../types';
import { ingestProjectUrl } from '../lib/ingestion/projectCrawler';
import { Globe, Sparkles, ArrowRight, CheckCircle2, Layers, Cpu } from 'lucide-react';

interface ProjectIngestorProps {
  onProjectIngested: (project: ProjectProfile) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const ProjectIngestor: React.FC<ProjectIngestorProps> = ({
  onProjectIngested,
  onCancel,
  isModal = false,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setStatusLog([
      `Initiating crawler for: ${urlInput.trim()}...`,
      'Extracting DOM tree & meta headers...',
      'Mapping technical keywords to X SimClusters...',
      'Calculating 9:1 Subreddit distribution targets...'
    ]);

    setTimeout(async () => {
      try {
        const profile = await ingestProjectUrl(urlInput);
        setStatusLog(prev => [...prev, `[SUCCESS] Ingested ${profile.name} (${profile.techStack.length} tech tokens extracted)`]);
        setTimeout(() => {
          setLoading(false);
          onProjectIngested(profile);
        }, 500);
      } catch (err) {
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className={`border border-brand-border bg-brand-surface rounded-2xl p-6 md:p-8 space-y-6 ${isModal ? 'max-w-2xl w-full' : ''}`}>
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider text-brand-accent">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Zero-Touch Project Ingestion</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-sans font-black text-white uppercase tracking-tight">
          Ingest Domain or Repository
        </h2>
        <p className="text-sm text-zinc-400">
          Enter your website domain (e.g. <span className="text-white font-mono">webforge.me</span>) or GitHub repository. PostForge extracts value props, tech stacks, and SimClusters to construct your growth campaigns.
        </p>
      </div>

      <form onSubmit={handleIngest} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Globe className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. webforge.me or github.com/owner/repo"
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-brand-accent transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-brand-accent text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(163,230,53,0.3)] disabled:opacity-50 cursor-pointer shrink-0"
          >
            {loading ? (
              <span className="flex items-center gap-2 font-mono">
                <span className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                Crawling...
              </span>
            ) : (
              <>
                <span>Ingest &amp; Generate</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-2 pt-1 text-xs font-mono text-zinc-500 flex-wrap">
          <span>Quick Try:</span>
          <button
            type="button"
            onClick={() => setUrlInput('https://www.webforge.me')}
            className="px-2.5 py-1 rounded-lg bg-brand-bg border border-brand-border hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            webforge.me
          </button>
          <button
            type="button"
            onClick={() => setUrlInput('https://github.com/Aryanban/portfolio')}
            className="px-2.5 py-1 rounded-lg bg-brand-bg border border-brand-border hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            github.com/Aryanban/portfolio
          </button>
        </div>
      </form>

      {/* Live Crawler Logs */}
      {statusLog.length > 0 && (
        <div className="p-4 rounded-xl border border-brand-border bg-brand-bg font-mono text-xs text-zinc-400 space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-brand-accent tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/5">
            <Cpu className="w-3 h-3" /> Crawl &amp; Synthesis Stream
          </div>
          {statusLog.map((log, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-zinc-600 select-none">&gt;</span>
              <span className={log.includes('[SUCCESS]') ? 'text-brand-accent font-bold' : ''}>{log}</span>
            </div>
          ))}
        </div>
      )}

      {isModal && onCancel && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
