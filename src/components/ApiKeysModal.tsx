import React, { useState } from 'react';
import { ApiVaultConfig } from '@postforge/core';
import { api, LINKEDIN_CONNECT_URL, type BackendStatus } from '../lib/api/client';
import type { PersistedApiConfig } from '../lib/storage/localVault';
import {
  X,
  Save,
  Info,
  CheckCircle2,
  Lock,
  Linkedin,
  AlertCircle,
} from 'lucide-react';

interface ApiKeysModalProps {
  settings: PersistedApiConfig;
  onSave: (settings: PersistedApiConfig) => void;
  onClose: () => void;
  backend: BackendStatus;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  settings,
  onSave,
  onClose,
  backend,
}) => {
  // Newly typed secrets live in memory ONLY. They are pushed to the backend's
  // encrypted vault on submit and never written to localStorage.
  const [draft, setDraft] = useState<ApiVaultConfig>({});
  const [activeTab, setActiveTab] = useState<'x' | 'reddit' | 'linkedin' | 'ai'>('x');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!backend.available) {
      setError(
        'The backend is offline — credentials can only be stored in the server-side encrypted vault. Start it with: npm -w @postforge/api run dev'
      );
      return;
    }

    setSaving(true);
    const failures: string[] = [];

    // X: only push when the full OAuth 1.0a set is present.
    if (draft.xApiKey && draft.xApiSecret && draft.xAccessToken && draft.xAccessSecret) {
      try {
        await api.putCredentials('x', {
          appKey: draft.xApiKey,
          appSecret: draft.xApiSecret,
          accessToken: draft.xAccessToken,
          accessSecret: draft.xAccessSecret,
        });
      } catch (err) {
        failures.push(`X: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (draft.redditClientId && draft.redditClientSecret && draft.redditUsername && draft.redditPassword) {
      try {
        await api.putCredentials('reddit', {
          clientId: draft.redditClientId,
          clientSecret: draft.redditClientSecret,
          username: draft.redditUsername,
          password: draft.redditPassword,
        });
      } catch (err) {
        failures.push(`Reddit: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (draft.geminiApiKey) {
      try {
        await api.putCredentials('gemini', { apiKey: draft.geminiApiKey });
      } catch (err) {
        failures.push(`Gemini: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    setSaving(false);

    if (failures.length > 0) {
      setError(`Vault sync failed for: ${failures.join('; ')}`);
      return; // do not claim success
    }

    // Persist ONLY the booleans — never the secrets.
    onSave({
      configuredProviders: {
        x: settings.configuredProviders.x || Boolean(draft.xApiKey),
        reddit: settings.configuredProviders.reddit || Boolean(draft.redditClientId),
        linkedin: settings.configuredProviders.linkedin,
        gemini: settings.configuredProviders.gemini || Boolean(draft.geminiApiKey),
      },
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const configured = settings.configuredProviders;

  // Esc dismisses the modal; focus starts on the panel for keyboard users.
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="API credentials and dispatch modes"
        tabIndex={-1}
        className="bg-brand-surface border border-brand-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 relative focus:outline-none"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="space-y-1.5 pr-10">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
              <Lock className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-brand-accent font-semibold">
              Encrypted Server Vault
            </span>
          </div>
          <h3 className="text-2xl font-sans font-black text-white uppercase tracking-tight">
            API Credentials &amp; Dispatch Modes
          </h3>
          <p className="text-xs text-zinc-400">
            Keys are pushed to the backend's AES-256-GCM vault and never written to this browser.
            Only a "configured" flag is stored locally. Secrets you type are dropped from memory
            the moment they are stored.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-[11px] font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Dispatch mode explainer */}
        <div className="p-4 rounded-xl border border-brand-border bg-brand-bg space-y-3">
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase">How dispatch works</h4>
            <p className="text-[11px] text-zinc-500 mt-1">
              With the backend running, approved posts ship automatically at their jittered time
              (simulated in dry-run, live with provider keys stored above). Without the backend,
              PostForge falls back to zero-cost 1-Click Native Intents — no paid API needed.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-brand-surface border border-white/5 text-[11px] font-mono text-zinc-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
            <span>
              <strong>Keys never leave the server.</strong> Everything you type here is pushed to the
              AES-256-GCM vault and dropped from browser memory immediately.
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 gap-4 text-xs font-mono">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'x'}
            onClick={() => setActiveTab('x')}
            className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'x' ? 'text-brand-accent border-b-2 border-brand-accent font-bold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            X / Twitter API v2
            {configured.x && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reddit'}
            onClick={() => setActiveTab('reddit')}
            className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reddit' ? 'text-brand-indigo border-b-2 border-brand-indigo font-bold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Reddit PRAW API
            {configured.reddit && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'linkedin'}
            onClick={() => setActiveTab('linkedin')}
            className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'linkedin' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            LinkedIn
            {configured.linkedin && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai' ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            AI Engine (Gemini)
            {configured.gemini && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {activeTab === 'x' && (
            <div className="space-y-3">
              {configured.x && (
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> X credentials stored in the server vault.
                  Type new values below to rotate them.
                </div>
              )}
              <div>
                <label className="block text-zinc-400 mb-1">X API Key (Consumer Key)</label>
                <input 
                  type="password"
                  value={draft.xApiKey || ''}
                  onChange={e => setDraft({ ...draft, xApiKey: e.target.value })}
                  placeholder="e.g. xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">X API Key Secret</label>
                <input 
                  type="password"
                  value={draft.xApiSecret || ''}
                  onChange={e => setDraft({ ...draft, xApiSecret: e.target.value })}
                  placeholder="e.g. xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Access Token (User Context)</label>
                <input 
                  type="password"
                  value={draft.xAccessToken || ''}
                  onChange={e => setDraft({ ...draft, xAccessToken: e.target.value })}
                  placeholder="e.g. xxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Access Token Secret</label>
                <input 
                  type="password"
                  value={draft.xAccessSecret || ''}
                  onChange={e => setDraft({ ...draft, xAccessSecret: e.target.value })}
                  placeholder="e.g. xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>
          )}

          {activeTab === 'reddit' && (
            <div className="space-y-3">
              {configured.reddit && (
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reddit credentials stored in the server vault.
                </div>
              )}
              <div>
                <label className="block text-zinc-400 mb-1">Reddit Client ID</label>
                <input 
                  type="text"
                  value={draft.redditClientId || ''}
                  onChange={e => setDraft({ ...draft, redditClientId: e.target.value })}
                  placeholder="e.g. your-app-id"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reddit Client Secret</label>
                <input 
                  type="password"
                  value={draft.redditClientSecret || ''}
                  onChange={e => setDraft({ ...draft, redditClientSecret: e.target.value })}
                  placeholder="e.g. your-secret"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reddit Username</label>
                <input 
                  type="text"
                  value={draft.redditUsername || ''}
                  onChange={e => setDraft({ ...draft, redditUsername: e.target.value })}
                  placeholder="u/username"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-indigo"
                />
              </div>
            </div>
          )}

          {activeTab === 'linkedin' && (
            <div className="space-y-3">
              {!backend.available ? (
                <p className="text-[11px] text-zinc-500">
                  Start the backend (<span className="text-zinc-300">npm -w @postforge/api run dev</span>) to connect LinkedIn via OAuth.
                </p>
              ) : backend.providers.linkedin ? (
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> LinkedIn account connected to the vault.
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-zinc-500">
                    LinkedIn uses OAuth 2.0 and is linked securely server-side. Requires
                    LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET in <span className="text-zinc-300">server/.env</span>.
                  </p>
                  <a
                    href={LINKEDIN_CONNECT_URL}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-white font-bold uppercase tracking-wider cursor-pointer hover:bg-sky-400 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>Connect LinkedIn Account</span>
                  </a>
                </>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-3">
              {configured.gemini && (
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Gemini key stored in the server vault.
                </div>
              )}
              <div>
                <label className="block text-zinc-400 mb-1">Google Gemini API Key (Optional)</label>
                <input 
                  type="password"
                  value={draft.geminiApiKey || ''}
                  onChange={e => setDraft({ ...draft, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                If omitted, PostForge uses its built-in algorithmic template engine with zero external API dependencies.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-brand-accent text-zinc-950 font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(163,230,53,0.3)] disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Vault Updated</span>
                </>
              ) : saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Storing…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Store in Server Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
