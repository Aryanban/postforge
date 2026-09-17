import type { PostItem, ProjectProfile, PostStatus, PostKind, PlatformType, SlotType } from '@postforge/core';
import type { PostRow, ProjectRow } from './client.js';

export function rowToProject(r: ProjectRow): ProjectProfile {
  return {
    id: r.id,
    domain: r.domain,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    techStack: JSON.parse(r.techStack),
    targetPersona: r.targetPersona,
    valueProps: JSON.parse(r.valueProps),
    simClusters: JSON.parse(r.simClusters),
    recommendedSubreddits: JSON.parse(r.recommendedSubreddits),
    lastIngestedAt: r.lastIngestedAt,
  };
}

export function rowToPost(r: PostRow): PostItem {
  return {
    id: r.id,
    projectId: r.projectId,
    platform: r.platform as PlatformType,
    slot: r.slot as SlotType,
    framework: r.framework,
    frameworkName: r.frameworkName,
    hook: r.hook,
    mainContent: r.mainContent,
    hasRootLink: !!r.hasRootLink,
    replyContent: r.replyContent ?? undefined,
    subreddit: r.subreddit ?? undefined,
    scheduledDate: r.scheduledDate,
    jitterMinutes: r.jitterMinutes,
    status: r.status as PostStatus,
    whyAlgorithmLikes: r.whyAlgorithmLikes,
    algorithmScore: JSON.parse(r.algorithmScore),
    linterChecks: JSON.parse(r.linterChecks),
    postKind: (r.postKind as PostKind) ?? 'root',
    threadParts: r.threadParts ? JSON.parse(r.threadParts) : undefined,
    parentRemoteId: r.parentRemoteId ?? undefined,
    remoteId: r.remoteId ?? undefined,
    dispatchedAt: r.dispatchedAt ?? undefined,
    simulated: !!r.simulated,
    error: r.error ?? undefined,
    attemptCount: r.attemptCount ?? 0,
  };
}

type PostInsertRow = {
  id: string;
  projectId: string;
  platform: string;
  slot: string;
  framework: string;
  frameworkName: string;
  hook: string;
  mainContent: string;
  hasRootLink: number;
  replyContent: string | null;
  subreddit: string | null;
  scheduledDate: string;
  jitterMinutes: number;
  status: string;
  whyAlgorithmLikes: string;
  algorithmScore: string;
  linterChecks: string;
  postKind: string;
  threadParts: string | null;
  parentRemoteId: string | null;
  remoteId: string | null;
  dispatchedAt: string | null;
  simulated: number;
  error: string | null;
  attemptCount: number;
  createdAt: string;
};

export function postToRow(p: PostItem): PostInsertRow {
  return {
    id: p.id,
    projectId: p.projectId,
    platform: p.platform,
    slot: p.slot,
    framework: p.framework,
    frameworkName: p.frameworkName,
    hook: p.hook,
    mainContent: p.mainContent,
    hasRootLink: p.hasRootLink ? 1 : 0,
    replyContent: p.replyContent ?? null,
    subreddit: p.subreddit ?? null,
    scheduledDate: p.scheduledDate,
    jitterMinutes: p.jitterMinutes,
    status: p.status,
    whyAlgorithmLikes: p.whyAlgorithmLikes,
    algorithmScore: JSON.stringify(p.algorithmScore),
    linterChecks: JSON.stringify(p.linterChecks),
    postKind: p.postKind ?? 'root',
    threadParts: p.threadParts ? JSON.stringify(p.threadParts) : null,
    parentRemoteId: p.parentRemoteId ?? null,
    remoteId: p.remoteId ?? null,
    dispatchedAt: p.dispatchedAt ?? null,
    simulated: p.simulated ? 1 : 0,
    error: p.error ?? null,
    attemptCount: p.attemptCount ?? 0,
    createdAt: new Date().toISOString(),
  };
}

type ProjectInsertRow = {
  id: string;
  domain: string;
  name: string;
  tagline: string;
  description: string;
  techStack: string;
  targetPersona: string;
  valueProps: string;
  simClusters: string;
  recommendedSubreddits: string;
  lastIngestedAt: string;
};

export function projectToRow(p: ProjectProfile): ProjectInsertRow {
  return {
    id: p.id,
    domain: p.domain,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    techStack: JSON.stringify(p.techStack),
    targetPersona: p.targetPersona,
    valueProps: JSON.stringify(p.valueProps),
    simClusters: JSON.stringify(p.simClusters),
    recommendedSubreddits: JSON.stringify(p.recommendedSubreddits),
    lastIngestedAt: p.lastIngestedAt,
  };
}
