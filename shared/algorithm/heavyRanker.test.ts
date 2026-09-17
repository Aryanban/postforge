import { describe, it, expect } from 'vitest';
import { calculateHeavyRankerScore } from './heavyRanker';
import { extractProjectKeywords } from './simClusterAligner';
import type { ProjectProfile } from '../types';

const GOOD_POST = `Most developers overcomplicate state management.

Here is the exact pattern we used:

• zero external dependencies
• single source of truth
• sub-50ms interactions

What is your #1 rule for keeping state clean?`;

const LINK = 'https://example.com';

describe('calculateHeavyRankerScore', () => {
  it('flags the root-link distribution penalty', () => {
    const withLink = calculateHeavyRankerScore(`Check this out ${LINK}`);
    expect(withLink.rootLinkPenalty).toBe(true);
  });

  it('rewards the 2-step link quarantine (URL moved to the reply)', () => {
    const quarantined = calculateHeavyRankerScore(GOOD_POST, `Live build: ${LINK}`);
    expect(quarantined.rootLinkPenalty).toBe(false);
    expect(quarantined.simClusterAlignment).toBeGreaterThan(0);
  });

  it('penalizes 2+ hashtags as spam', () => {
    const spammy = calculateHeavyRankerScore(`ship it #saas #startup #ai`);
    expect(spammy.hashtagCount).toBe(3);
    expect(spammy.netScore).toBeLessThan(quarantinedScore());
  });

  it('detects reply hooks and unlocks the 150x author-reply weight', () => {
    const withQuestion = calculateHeavyRankerScore(GOOD_POST);
    expect(withQuestion.replyMultiplier).toBe(150);
    const noQuestion = calculateHeavyRankerScore('Just shipped a thing. It works.');
    expect(noQuestion.replyMultiplier).toBe(75);
  });

  it('estimates dwell time and rewards formatting', () => {
    const formatted = calculateHeavyRankerScore(GOOD_POST);
    const wall = calculateHeavyRankerScore('a b c d e f g h i j k l m n o p');
    expect(formatted.dwellTimeSeconds).toBeGreaterThan(wall.dwellTimeSeconds);
  });

  it('applies a lighter link penalty off X (LinkedIn/Reddit)', () => {
    const onX = calculateHeavyRankerScore(`see ${LINK}`, undefined, { platform: 'x' });
    const onLinkedIn = calculateHeavyRankerScore(`see ${LINK}`, undefined, { platform: 'linkedin' });
    expect(onLinkedIn.netScore).toBeGreaterThan(onX.netScore);
  });

  it('computes SimCluster alignment from project keywords instead of a constant', () => {
    const project: ProjectProfile = {
      id: 'p', domain: 'd.com', name: 'Demo', tagline: 't', description: 'react typescript',
      techStack: ['React', 'TypeScript'], targetPersona: 'devs', valueProps: ['speed'],
      simClusters: ['React'], recommendedSubreddits: [], lastIngestedAt: new Date().toISOString(),
    };
    const keywords = extractProjectKeywords(project);
    const aligned = calculateHeavyRankerScore('React and TypeScript tips for devs', undefined, { keywords });
    const offTopic = calculateHeavyRankerScore('gardening and cooking recipes', undefined, { keywords });
    expect(aligned.simClusterAlignment).toBeGreaterThan(offTopic.simClusterAlignment);
    expect(aligned.simClusterAlignment).not.toBe(92);
  });

  it('clamps the net score within a sane range', () => {
    const score = calculateHeavyRankerScore(GOOD_POST, `Live build: ${LINK}`);
    expect(score.netScore).toBeGreaterThanOrEqual(0);
    expect(score.netScore).toBeLessThanOrEqual(99);
    expect(score.impressionMultiplierEst).toBeGreaterThan(0);
  });
});

function quarantinedScore(): number {
  return calculateHeavyRankerScore(GOOD_POST, `Live build: ${LINK}`).netScore;
}
