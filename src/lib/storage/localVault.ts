import { ProjectProfile, PostItem } from '@postforge/core';

const VAULT_KEYS = {
  PROJECTS: 'postforge_projects_v1',
  ACTIVE_PROJECT_ID: 'postforge_active_project_v1',
  POSTS: 'postforge_posts_v1',
  API_CONFIG: 'postforge_api_config_v1',
};

/**
 * The ONLY provider state persisted to localStorage.
 *
 * Secrets themselves are never written to the browser — they are pushed to the
 * backend's encrypted vault and then dropped from memory. We keep just enough
 * here to render the UI honestly ("which providers did I configure?") and to
 * pick a dispatch mode, with zero credential material at rest in the client.
 */
export interface PersistedApiConfig {
  isApiModeActive: boolean;
  configuredProviders: {
    x: boolean;
    reddit: boolean;
    linkedin: boolean;
    gemini: boolean;
  };
}

export const EMPTY_API_CONFIG: PersistedApiConfig = {
  isApiModeActive: false,
  configuredProviders: { x: false, reddit: false, linkedin: false, gemini: false },
};

export const DEFAULT_PROJECT: ProjectProfile = {
  id: 'webforge-me',
  domain: 'webforge.me',
  name: 'Aryan Bansal Portfolio & Systems Hub',
  tagline: 'High-performance systems engineering, hardware simulators, and brutalist UI architectures.',
  description: 'Personal systems engineering portfolio showcasing RISC-V processor simulation, University ERP architecture, and dark-themed brutalist design systems built in React 19 and Tailwind CSS.',
  techStack: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'Java (Spring/Swing)', 'Python (RISC-V)'],
  targetPersona: 'Software Engineers, Systems Programmers, Tech Recruiters, and UI/UX Designers',
  valueProps: [
    'Open-source hardware simulator & RISC-V RV32I instruction parser',
    'Dual-database ERP architecture with strict RBAC access control',
    'Sleek dark brutalist aesthetic with interactive CLI terminal and JSON composer',
    'Verified Google Search Console index compliance & XML sitemap automation'
  ],
  simClusters: ['Computer Systems', 'Indie Hackers', 'UI/UX Engineering', 'Frontend Architecture'],
  recommendedSubreddits: ['r/webdev', 'r/SideProject', 'r/reactjs', 'r/Frontend', 'r/learnprogramming'],
  // Getter, not a field: avoids the "Ingested: <date>" label being frozen at
  // the moment the bundle was first evaluated.
  get lastIngestedAt(): string {
    return new Date().toISOString();
  }
};

export function loadStoredProjects(): ProjectProfile[] {
  try {
    const raw = localStorage.getItem(VAULT_KEYS.PROJECTS);
    if (!raw) return [DEFAULT_PROJECT];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_PROJECT];
  } catch (e) {
    return [DEFAULT_PROJECT];
  }
}

export function saveProjects(projects: ProjectProfile[]) {
  localStorage.setItem(VAULT_KEYS.PROJECTS, JSON.stringify(projects));
}

export function loadActiveProjectId(): string {
  return localStorage.getItem(VAULT_KEYS.ACTIVE_PROJECT_ID) || 'webforge-me';
}

export function saveActiveProjectId(id: string) {
  localStorage.setItem(VAULT_KEYS.ACTIVE_PROJECT_ID, id);
}

export function loadStoredPosts(): PostItem[] {
  try {
    const raw = localStorage.getItem(VAULT_KEYS.POSTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function savePosts(posts: PostItem[]) {
  localStorage.setItem(VAULT_KEYS.POSTS, JSON.stringify(posts));
}

export function loadApiConfig(): PersistedApiConfig {
  try {
    const raw = localStorage.getItem(VAULT_KEYS.API_CONFIG);
    if (!raw) return EMPTY_API_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PersistedApiConfig>;
    return {
      isApiModeActive: Boolean(parsed.isApiModeActive),
      configuredProviders: {
        x: Boolean(parsed.configuredProviders?.x),
        reddit: Boolean(parsed.configuredProviders?.reddit),
        linkedin: Boolean(parsed.configuredProviders?.linkedin),
        gemini: Boolean(parsed.configuredProviders?.gemini),
      },
    };
  } catch (e) {
    return EMPTY_API_CONFIG;
  }
}

export function saveApiConfig(config: PersistedApiConfig) {
  localStorage.setItem(VAULT_KEYS.API_CONFIG, JSON.stringify(config));
}
