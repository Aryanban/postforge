import type { PostItem, PlatformType, PostPerformance, ProjectProfile } from '@postforge/core';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api';

export const LINKEDIN_CONNECT_URL = `${API_URL}/auth/linkedin`;

export interface ProviderStatus {
  x: boolean;
  reddit: boolean;
  linkedin: boolean;
}

export interface BackendStatus {
  available: boolean;
  dryRun: boolean;
  providers: ProviderStatus;
  geminiConfigured: boolean;
}

export const OFFLINE_STATUS: BackendStatus = {
  available: false,
  dryRun: true,
  providers: { x: false, reddit: false, linkedin: false },
  geminiConfigured: false,
};

export interface DispatchLogEntry {
  id: number;
  postId: string;
  provider: string;
  status: string;
  message: string;
  at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? body?.error ?? message;
    } catch {
      /* keep status message */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

/** Best-effort call; never throws (used for non-critical syncs). */
async function fireAndForget(path: string, init?: RequestInit): Promise<void> {
  try {
    await request(path, init);
  } catch {
    /* offline fallback — local state remains authoritative */
  }
}

export const api = {
  health: async (): Promise<BackendStatus> => {
    try {
      const data = await request<BackendStatus & { ok: boolean }>('/health', {
        signal: AbortSignal.timeout(2500),
      });
      return {
        available: true,
        dryRun: data.dryRun,
        providers: data.providers,
        geminiConfigured: data.geminiConfigured ?? false,
      };
    } catch {
      return OFFLINE_STATUS;
    }
  },

  ingest: (url: string) =>
    request<ProjectProfile>('/projects/ingest', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  generate: (projectId: string, framework?: string) =>
    request<PostItem[]>('/posts/generate', {
      method: 'POST',
      body: JSON.stringify({ projectId, framework }),
    }),

  generateAI: (projectId: string, framework: string, platform: PlatformType) =>
    request<{
      post: PostItem;
      rounds: number;
      accepted: boolean;
      candidates: { round: number; netScore: number; critical: number; warnings: number }[];
    }>('/posts/generate-ai', {
      method: 'POST',
      body: JSON.stringify({ projectId, framework, platform }),
    }),

  savePost: (post: PostItem) =>
    fireAndForget('/posts', { method: 'POST', body: JSON.stringify(post) }),

  listPosts: () => request<PostItem[]>('/posts'),

  updatePost: (id: string, patch: { mainContent?: string; replyContent?: string; scheduledDate?: string }) =>
    request<PostItem>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),

  approve: (id: string) =>
    request<PostItem>(`/posts/${id}/approve`, { method: 'POST' }),

  dispatch: (id: string) =>
    request<{ ok: boolean; remoteId: string; simulated: boolean }>(
      `/posts/${id}/dispatch`,
      { method: 'POST' }
    ),

  remove: (id: string) => fireAndForget(`/posts/${id}`, { method: 'DELETE' }),

  configStatus: () =>
    request<{ dryRun: boolean; providers: ProviderStatus }>('/config/status'),

  putCredentials: (provider: 'x' | 'reddit' | 'linkedin' | 'gemini', credentials: unknown) =>
    fireAndForget('/config/credentials', {
      method: 'PUT',
      body: JSON.stringify({ provider, credentials }),
    }),

  logs: (limit = 50) =>
    request<DispatchLogEntry[]>(`/dispatch/log?limit=${limit}`),

  logPerformance: (id: string, metrics: Omit<PostPerformance, 'postId' | 'recordedAt'>) =>
    request<PostPerformance>(`/posts/${id}/performance`, {
      method: 'PUT',
      body: JSON.stringify(metrics),
    }),

  getPerformance: (id: string) =>
    request<Partial<PostPerformance>>(`/posts/${id}/performance`),
};
