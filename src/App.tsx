import React, { useState, useEffect } from 'react';
import { ProjectProfile, PostItem, ApiVaultConfig } from './types';
import { 
  loadStoredProjects, 
  saveProjects, 
  loadActiveProjectId, 
  saveActiveProjectId, 
  loadStoredPosts, 
  savePosts, 
  loadApiConfig, 
  saveApiConfig, 
  DEFAULT_PROJECT 
} from './lib/storage/localVault';
import { generateCustomAngle } from './lib/generators/promptTemplates';
import { Navbar } from './components/Navbar';
import { ProjectIngestor } from './components/ProjectIngestor';
import { PostStudio } from './components/PostStudio';
import { ScheduleQueue } from './components/ScheduleQueue';
import { RedditStrategist } from './components/RedditStrategist';
import { ApiKeysModal } from './components/ApiKeysModal';
import { 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  Globe, 
  Layers, 
  Cpu, 
  ShieldCheck,
  Github,
  Zap
} from 'lucide-react';

export function App() {
  const [projects, setProjects] = useState<ProjectProfile[]>(() => loadStoredProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => loadActiveProjectId());
  const [queuePosts, setQueuePosts] = useState<PostItem[]>(() => loadStoredPosts());
  const [apiConfig, setApiConfig] = useState<ApiVaultConfig>(() => loadApiConfig());

  const [activeTab, setActiveTab] = useState<'studio' | 'queue' | 'reddit' | 'project'>('studio');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || DEFAULT_PROJECT;

  // Persist state changes
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveActiveProjectId(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    savePosts(queuePosts);
  }, [queuePosts]);

  useEffect(() => {
    saveApiConfig(apiConfig);
  }, [apiConfig]);

  const handleProjectIngested = (newProject: ProjectProfile) => {
    const exists = projects.some(p => p.id === newProject.id);
    const updated = exists ? projects.map(p => p.id === newProject.id ? newProject : p) : [newProject, ...projects];
    setProjects(updated);
    setActiveProjectId(newProject.id);
    setIsNewProjectModalOpen(false);
    setActiveTab('studio');
  };

  const handleSchedulePost = (post: PostItem) => {
    const exists = queuePosts.some(p => p.id === post.id);
    if (!exists) {
      setQueuePosts([post, ...queuePosts]);
    }
  };

  const handleRemovePostFromQueue = (id: string) => {
    setQueuePosts(queuePosts.filter(p => p.id !== id));
  };

  const handleUpdatePostStatus = (id: string, status: PostItem['status']) => {
    setQueuePosts(queuePosts.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleGenerateRedditStory = () => {
    const redditPost = generateCustomAngle(activeProject, 'reddit-story');
    handleSchedulePost(redditPost);
    setActiveTab('queue');
  };

  const hasApiKeys = Boolean(apiConfig.xApiKey || apiConfig.redditClientId || apiConfig.geminiApiKey);

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-zinc-100 font-sans">
      {/* Top Navbar */}
      <Navbar 
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(p) => setActiveProjectId(p.id)}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        hasApiKeys={hasApiKeys}
      />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shrink-0 ${
                activeTab === 'studio'
                  ? 'bg-brand-accent text-zinc-950 shadow-[0_0_12px_rgba(163,230,53,0.3)]'
                  : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Daily Post Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shrink-0 ${
                activeTab === 'queue'
                  ? 'bg-brand-accent text-zinc-950 shadow-[0_0_12px_rgba(163,230,53,0.3)]'
                  : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Scheduled Queue ({queuePosts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reddit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shrink-0 ${
                activeTab === 'reddit'
                  ? 'bg-brand-indigo text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reddit 9:1 Strategist</span>
            </button>

            <button
              onClick={() => setActiveTab('project')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shrink-0 ${
                activeTab === 'project'
                  ? 'bg-zinc-800 text-white border border-white/20'
                  : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Project Ingestion Spec</span>
            </button>
          </div>

          {/* Quick status pill */}
          <div className="text-[11px] font-mono text-zinc-500 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
            <span>Heavy Ranker Inversion Active</span>
          </div>
        </div>

        {/* Tab 1: Studio */}
        {activeTab === 'studio' && (
          <PostStudio 
            key={activeProject.id}
            project={activeProject} 
            onSchedulePost={handleSchedulePost}
          />
        )}

        {/* Tab 2: Queue */}
        {activeTab === 'queue' && (
          <ScheduleQueue 
            posts={queuePosts}
            onRemovePost={handleRemovePostFromQueue}
            onUpdateStatus={handleUpdatePostStatus}
            hasApiKeys={hasApiKeys}
          />
        )}

        {/* Tab 3: Reddit */}
        {activeTab === 'reddit' && (
          <RedditStrategist 
            project={activeProject}
            onGenerateRedditPost={handleGenerateRedditStory}
          />
        )}

        {/* Tab 4: Ingested Project Overview */}
        {activeTab === 'project' && (
          <div className="space-y-8">
            <ProjectIngestor onProjectIngested={handleProjectIngested} />

            {/* Ingested Profile Specs */}
            <div className="border border-brand-border bg-brand-surface rounded-2xl p-6 md:p-8 space-y-6">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-accent block">
                  SYNTHESIZED ARCHITECTURE PROFILE
                </span>
                <h3 className="text-2xl font-sans font-black text-white uppercase mt-0.5">
                  {activeProject.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Domain: {activeProject.domain} • Ingested: {new Date(activeProject.lastIngestedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                <div className="p-4 rounded-xl border border-brand-border bg-brand-bg space-y-2">
                  <span className="text-zinc-500 uppercase font-bold block">Tagline</span>
                  <p className="text-zinc-200 text-sm">{activeProject.tagline}</p>
                </div>

                <div className="p-4 rounded-xl border border-brand-border bg-brand-bg space-y-2">
                  <span className="text-zinc-500 uppercase font-bold block">Target Persona</span>
                  <p className="text-zinc-200 text-sm">{activeProject.targetPersona}</p>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-zinc-400 block">
                  Extracted Tech Stack Tokens:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeProject.techStack.map(tech => (
                    <span key={tech} className="px-3 py-1 rounded-lg bg-brand-bg border border-brand-border font-mono text-xs text-zinc-200">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-zinc-400 block">
                  Target X SimClusters:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeProject.simClusters.map(cluster => (
                    <span key={cluster} className="px-3 py-1 rounded-lg bg-brand-accent/10 border border-brand-accent/30 font-mono text-xs text-brand-accent font-bold">
                      {cluster}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Project Ingestion Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <ProjectIngestor 
            isModal={true}
            onProjectIngested={handleProjectIngested}
            onCancel={() => setIsNewProjectModalOpen(false)}
          />
        </div>
      )}

      {/* API Keys Modal */}
      {isApiModalOpen && (
        <ApiKeysModal 
          config={apiConfig}
          onSave={(updated) => setApiConfig(updated)}
          onClose={() => setIsApiModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-brand-border py-8 px-6 bg-brand-surface/40 mt-16 text-center text-xs font-mono text-zinc-500 space-y-2">
        <div>
          POSTFORGE • OPEN-SOURCE ALGORITHM-NATIVE GROWTH ENGINE
        </div>
        <div className="text-[11px] text-zinc-600">
          Built upon X Heavy Ranker math, Postiz scheduling principles, and Crawl4AI zero-touch ingestion.
        </div>
      </footer>
    </div>
  );
}
