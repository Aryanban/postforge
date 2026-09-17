import { describe, it, expect } from 'vitest';
import { generateOptimizedPost, type DraftGenerator } from './generateLoop';
import type { AIDraft, PlatformType, ProjectProfile } from '@postforge/core';

const PROJECT: ProjectProfile = {
  id: 'demo',
  domain: 'demo.com',
  name: 'Demo Platform',
  tagline: 'A react and typescript platform',
  description: 'We build react interfaces with typescript for developers.',
  techStack: ['React', 'TypeScript'],
  targetPersona: 'developers',
  valueProps: ['zero-latency rendering'],
  simClusters: ['Frontend Architecture'],
  recommendedSubreddits: ['r/reactjs'],
  lastIngestedAt: new Date().toISOString(),
};

const WEAK: AIDraft = {
  hook: 'Our product is amazing',
  mainContent:
    'https://example.com is where we built something incredible with great features #saas #startup #ai',
  replyContent: undefined,
  whyAlgorithmLikes: '',
};

const STRONG: AIDraft = {
  hook: 'Most developers overcomplicate state management.',
  mainContent:
    'Most developers overcomplicate state management.\n\nHere is the exact pattern we used:\n\n• zero external dependencies\n• single source of truth\n\nWhat is your #1 rule for keeping state clean?',
  replyContent: 'Live build and source code: https://example.com',
  whyAlgorithmLikes: 'Bullets for dwell, a real question for replies, link quarantined.',
};

// Round 1 is weak (root link + hashtag spam + no hook); feedback triggers a strong round 2.
const improving: DraftGenerator = (_project, _framework, _platform, feedback) =>
  Promise.resolve(feedback ? STRONG : WEAK);

const alwaysWeak: DraftGenerator = () => Promise.resolve(WEAK);

describe('generateOptimizedPost', () => {
  it('iterates on weak drafts and accepts the improved one', async () => {
    const result = await generateOptimizedPost(PROJECT, 'morning-velocity', 'x', {}, improving);
    expect(result.rounds).toBe(2);
    expect(result.accepted).toBe(true);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].netScore).toBeLessThan(result.candidates[1].netScore);
    expect(result.candidates[0].critical).toBeGreaterThan(0);
    expect(result.candidates[1].critical).toBe(0);
  });

  it('ships the best available draft when the threshold is never cleared', async () => {
    const result = await generateOptimizedPost(PROJECT, 'morning-velocity', 'x', {}, alwaysWeak);
    expect(result.accepted).toBe(false);
    expect(result.candidates).toHaveLength(3);
    expect(result.post.algorithmScore.rootLinkPenalty).toBe(true);
  });

  it('never trusts raw AI output — every post carries a real algorithm score', async () => {
    const result = await generateOptimizedPost(PROJECT, 'morning-velocity', 'x', {}, improving);
    expect(result.post.algorithmScore.netScore).toBeGreaterThan(0);
    expect(result.post.linterChecks.length).toBeGreaterThan(0);
    expect(result.post.scheduledDate).toBeDefined();
  });

  it('respects the platform it is asked to generate for', async () => {
    const result = await generateOptimizedPost(
      PROJECT,
      'reddit-story',
      'reddit' as PlatformType,
      {},
      improving
    );
    expect(result.post.platform).toBe('reddit');
  });
});
