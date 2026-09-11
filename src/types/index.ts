export interface ProjectProfile {
  id: string;
  domain: string;
  name: string;
  tagline: string;
  description: string;
  techStack: string[];
  targetPersona: string;
  valueProps: string[];
  simClusters: string[];
  recommendedSubreddits: string[];
  lastIngestedAt: string;
}

export type PlatformType = 'x' | 'reddit';
export type SlotType = 'morning' | 'evening' | 'custom';
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published';

export interface PostItem {
  id: string;
  projectId: string;
  platform: PlatformType;
  slot: SlotType;
  framework: string;
  frameworkName: string;
  hook: string;
  mainContent: string;
  hasRootLink: boolean;
  replyContent?: string; // Link quarantine: link placed in 1st reply
  subreddit?: string;    // If Reddit
  scheduledDate: string; // ISO string
  jitterMinutes: number; // e.g. +14 mins humanized offset
  status: PostStatus;
  whyAlgorithmLikes: string;
  algorithmScore: HeavyRankerMetrics;
  linterChecks: ShadowbanCheck[];
}

export interface HeavyRankerMetrics {
  netScore: number;                 // 0 to 100
  replyMultiplier: number;          // e.g. 27x to 150x
  dwellTimeSeconds: number;         // Estimated dwell time
  rootLinkPenalty: boolean;         // -50% distribution penalty if true
  hashtagCount: number;             // >1 triggers de-ranking
  simClusterAlignment: number;      // 0 to 100
  impressionMultiplierEst: number;  // e.g. 2.4x
}

export interface ShadowbanCheck {
  id: string;
  title: string;
  severity: 'pass' | 'warning' | 'critical';
  details: string;
  fixDescription?: string;
  fixable: boolean;
}

export interface ApiVaultConfig {
  xApiKey?: string;
  xApiSecret?: string;
  xAccessToken?: string;
  xAccessSecret?: string;
  xBearerToken?: string;
  redditClientId?: string;
  redditClientSecret?: string;
  redditUsername?: string;
  redditPassword?: string;
  geminiApiKey?: string;
  isApiModeActive: boolean; // false = free 1-click Native Intent launcher
}
