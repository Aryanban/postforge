import {
  calculateHeavyRankerScore,
  calculateJitteredSchedule,
  frameworkById,
  lintPostContent,
  type AIDraft,
  type HeavyRankerMetrics,
  type LinterResult,
  type PlatformType,
  type PostItem,
  type ProjectProfile,
} from '@postforge/core';
import { generateDraft } from './gemini.js';
import { config } from '../config.js';

const MAX_ROUNDS = 3;
const ACCEPT_THRESHOLD = 80;
const URL_RE = /https?:\/\//i;

export interface GenerateOptions {
  rounds?: number;
  threshold?: number;
}

export interface CandidateSummary {
  round: number;
  netScore: number;
  critical: number;
  warnings: number;
}

export interface GenerateResult {
  post: PostItem;
  rounds: number;
  accepted: boolean;
  candidates: CandidateSummary[];
}

export type DraftGenerator = (
  project: ProjectProfile,
  frameworkId: string,
  platform: PlatformType,
  feedback?: string
) => Promise<AIDraft>;

interface Scored {
  draft: AIDraft;
  score: HeavyRankerMetrics;
  lints: LinterResult;
}

/**
 * The core differentiator: AI drafts are never trusted blindly. Each candidate
 * is scored by the REAL Heavy Ranker + anti-shadowban linter, and the model is
 * re-prompted with concrete feedback until the draft clears the threshold or
 * the round budget is exhausted. The best-scoring draft always wins.
 */
export async function generateOptimizedPost(
  project: ProjectProfile,
  frameworkId: string,
  platform: PlatformType,
  options: GenerateOptions = {},
  generateFn: DraftGenerator = generateDraft
): Promise<GenerateResult> {
  const maxRounds = options.rounds ?? MAX_ROUNDS;
  const threshold = options.threshold ?? ACCEPT_THRESHOLD;

  let best: Scored | null = null;
  let feedback: string | undefined;
  const candidates: CandidateSummary[] = [];

  for (let round = 1; round <= maxRounds; round++) {
    const draft = await generateFn(project, frameworkId, platform, feedback);
    const reply = draft.replyContent ?? undefined;
    const score = calculateHeavyRankerScore(draft.mainContent, reply);
    const lints = lintPostContent(draft.mainContent, reply);
    const critical = lints.checks.filter(c => c.severity === 'critical').length;
    const warnings = lints.checks.filter(c => c.severity === 'warning').length;
    candidates.push({ round, netScore: score.netScore, critical, warnings });

    if (!best || score.netScore > best.score.netScore) {
      best = { draft, score, lints };
    }
    if (score.netScore >= threshold && critical === 0) {
      return {
        post: toPost(best.draft, project, platform, frameworkId, best.score, best.lints),
        rounds: round,
        accepted: true,
        candidates,
      };
    }
    feedback = buildFeedback(draft, score, lints);
  }

  return {
    post: toPost(best!.draft, project, platform, frameworkId, best!.score, best!.lints),
    rounds: maxRounds,
    accepted: false,
    candidates,
  };
}

function buildFeedback(draft: AIDraft, score: HeavyRankerMetrics, lints: LinterResult): string {
  const problems: string[] = [`current algorithmic score is ${score.netScore}/100 (needs 80+)`];
  lints.checks
    .filter(c => c.severity !== 'pass')
    .forEach(c => problems.push(`${c.severity}: ${c.title} — ${c.fixDescription ?? c.details}`));
  if (score.dwellTimeSeconds < 8) {
    problems.push('dwell time is too low — break the body into shorter lines and bullets');
  }
  if (score.replyMultiplier < 150) {
    problems.push('no reply hook detected — end with a specific question to unlock the 150x author-reply weight');
  }
  if (URL_RE.test(draft.mainContent)) {
    problems.push('the root post contains a URL — move it to replyContent');
  }
  return problems.join('; ');
}

function toPost(
  draft: AIDraft,
  project: ProjectProfile,
  platform: PlatformType,
  frameworkId: string,
  score: HeavyRankerMetrics,
  lints: LinterResult
): PostItem {
  const slot = platform === 'reddit' ? 'evening' : 'morning';
  const timing = calculateJitteredSchedule(slot, undefined, config.timezone);
  return {
    id: `ai-${Date.now()}`,
    projectId: project.id,
    platform,
    slot: 'custom',
    framework: frameworkId,
    frameworkName: frameworkById(frameworkId)?.name ?? 'AI Generated',
    hook: draft.hook,
    mainContent: draft.mainContent,
    hasRootLink: URL_RE.test(draft.mainContent),
    replyContent: draft.replyContent,
    subreddit: platform === 'reddit' ? project.recommendedSubreddits[0] : undefined,
    threadParts: draft.threadParts && draft.threadParts.length > 1 ? draft.threadParts : undefined,
    scheduledDate: timing.scheduledDate.toISOString(),
    jitterMinutes: timing.jitterMinutes,
    status: 'draft',
    whyAlgorithmLikes: draft.whyAlgorithmLikes,
    algorithmScore: score,
    linterChecks: lints.checks,
  };
}
