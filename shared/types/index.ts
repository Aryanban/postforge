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

export type PlatformType = 'x' | 'reddit' | 'linkedin';
export type SlotType = 'morning' | 'evening' | 'custom';
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'failed';

/**
 * Structural role a row plays in the dispatch pipeline.
 * - root:  a standalone top-level post
 * - reply: a delayed follow-up (e.g. the quarantined link) chained to a parent
 */
export type PostKind = 'root' | 'reply';

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

  // --- Dispatch pipeline (server-managed) ---
  postKind?: PostKind;
  threadParts?: string[];        // Real multi-part thread bodies (X), each <= 280 chars
  parentRemoteId?: string;       // For replies: the platform id of the parent post
  remoteId?: string;             // Platform post id once dispatched
  dispatchedAt?: string;         // ISO timestamp of successful dispatch
  simulated?: boolean;           // true when produced by dry-run (no live API keys)
  error?: string;                // Last dispatch failure message
  attemptCount?: number;         // Dispatch attempts (retry with backoff)
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
