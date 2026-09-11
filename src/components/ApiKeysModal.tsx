import React, { useState } from 'react';
import { ApiVaultConfig } from '../types';
import { 
  Key, 
  X, 
  ShieldCheck, 
  Save, 
  Info, 
  CheckCircle2, 
  Sparkles,
  Lock
} from 'lucide-react';

interface ApiKeysModalProps {
  config: ApiVaultConfig;
  onSave: (config: ApiVaultConfig) => void;
  onClose: () => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  config,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<ApiVaultConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'x' | 'reddit' | 'ai'>('x');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 relative">
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
              Client-Side Local Vault
            </span>
          </div>
          <h3 className="text-2xl font-sans font-black text-white uppercase tracking-tight">
            API Credentials &amp; Dispatch Modes
          </h3>
          <p className="text-xs text-zinc-400">
            All API tokens are stored strictly in your browser's encrypted local storage. Never proxied or sent to third-party databases.
          </p>
        </div>

        {/* Dispatch Mode Toggle */}
        <div className="p-4 rounded-xl border border-brand-border bg-brand-bg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase">Automated API Dispatch Mode</h4>
              <p className="text-[11px] text-zinc-500">
                Turn ON if you have paid X API Basic keys ($100/mo) or standard Reddit API credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isApiModeActive: !formData.isApiModeActive })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                formData.isApiModeActive ? 'bg-brand-accent' : 'bg-zinc-800'
              }`}
            >
              <span 
                className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-1 transition-transform ${
                  formData.isApiModeActive ? 'left-7' : 'left-1'
                }`} 
              />
            </button>
          </div>

          {!formData.isApiModeActive && (
            <div className="p-2.5 rounded-lg bg-brand-surface border border-white/5 text-[11px] font-mono text-zinc-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Cost Intent Mode Active:</strong> You don't need any paid X API credentials! PostForge will format posts algorithmically and launch them via 1-click Native Intents.
              </span>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 gap-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('x')}
            className={`pb-2 transition-colors cursor-pointer ${
              activeTab === 'x' ? 'text-brand-accent border-b-2 border-brand-accent font-bold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            X / Twitter API v2
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reddit')}
            className={`pb-2 transition-colors cursor-pointer ${
              activeTab === 'reddit' ? 'text-brand-indigo border-b-2 border-brand-indigo font-bold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Reddit PRAW API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`pb-2 transition-colors cursor-pointer ${
              activeTab === 'ai' ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold' : 'text-zinc-500 hover:text-white'
            }`}
          >
            AI Engine (Gemini)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {activeTab === 'x' && (
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">X API Key (Consumer Key)</label>
                <input 
                  type="password"
                  value={formData.xApiKey || ''}
                  onChange={e => setFormData({ ...formData, xApiKey: e.target.value })}
                  placeholder="e.g. xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">X API Key Secret</label>
                <input 
                  type="password"
                  value={formData.xApiSecret || ''}
                  onChange={e => setFormData({ ...formData, xApiSecret: e.target.value })}
                  placeholder="e.g. xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Access Token (User Context)</label>
                <input 
                  type="password"
                  value={formData.xAccessToken || ''}
                  onChange={e => setFormData({ ...formData, xAccessToken: e.target.value })}
                  placeholder="e.g. xxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Access Token Secret</label>
                <input 
                  type="password"
                  value={formData.xAccessSecret || ''}
                  onChange={e => setFormData({ ...formData, xAccessSecret: e.target.value })}
                  placeholder="e.g. xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>
          )}

          {activeTab === 'reddit' && (
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Reddit Client ID</label>
                <input 
                  type="text"
                  value={formData.redditClientId || ''}
                  onChange={e => setFormData({ ...formData, redditClientId: e.target.value })}
                  placeholder="e.g. your-app-id"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reddit Client Secret</label>
                <input 
                  type="password"
                  value={formData.redditClientSecret || ''}
                  onChange={e => setFormData({ ...formData, redditClientSecret: e.target.value })}
                  placeholder="e.g. your-secret"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reddit Username</label>
                <input 
                  type="text"
                  value={formData.redditUsername || ''}
                  onChange={e => setFormData({ ...formData, redditUsername: e.target.value })}
                  placeholder="u/username"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-brand-indigo"
                />
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Google Gemini API Key (Optional)</label>
                <input 
                  type="password"
                  value={formData.geminiApiKey || ''}
                  onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
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
              className="px-6 py-2.5 rounded-xl bg-brand-accent text-zinc-950 font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(163,230,53,0.3)]"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Vault Updated</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Vault Config</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
