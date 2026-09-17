import { describe, it, expect } from 'vitest';
import { generateDailyPostBatch, generateCustomAngle } from './promptTemplates';
import type { ProjectProfile } from '../types';

const PROJECT: ProjectProfile = {
  id: 'demo',
  domain: 'demo.com',
  name: 'Demo Platform',
  tagline: 'A react and typescript platform',
  description: 'We build react interfaces with typescript for developers.',
  techStack: ['React', 'TypeScript', 'Vite'],
  targetPersona: 'developers',
  valueProps: ['zero-latency rendering', 'typescript-first apis'],
  simClusters: ['Frontend Architecture'],
  recommendedSubreddits: ['r/reactjs', 'r/SideProject'],
  lastIngestedAt: new Date().toISOString(),
};

describe('generateDailyPostBatch', () => {
  it('produces a morning + evening pair with no root links', () => {
    const batch = generateDailyPostBatch(PROJECT);
    expect(batch).toHaveLength(2);
    expect(batch[0].slot).toBe('morning');
    expect(batch[1].slot).toBe('evening');
    batch.forEach(post => {
      expect(post.hasRootLink).toBe(false);
      expect(post.mainContent).not.toMatch(/https?:\/\//);
      expect(post.replyContent).toMatch(/https?:\/\//);
      expect(post.algorithmScore.simClusterAlignment).not.toBe(92);
    });
  });
});

describe('generateCustomAngle', () => {
  it('splits the thread-hook into five real, dispatchable parts', () => {
    const post = generateCustomAngle(PROJECT, 'thread-hook');
    expect(post.framework).toBe('thread-hook');
    expect(post.threadParts).toBeDefined();
    expect(post.threadParts).toHaveLength(5);
    post.threadParts!.forEach(part => {
      expect(part.length).toBeLessThanOrEqual(280);
    });
    // The editor shows part 1 as the root post.
    expect(post.mainContent).toBe(post.threadParts![0]);
    // Links stay quarantined out of the root post.
    expect(post.threadParts![0]).not.toMatch(/https?:\/\//);
  });

  it('targets reddit with a subreddit for the reddit-story angle', () => {
    const post = generateCustomAngle(PROJECT, 'reddit-story');
    expect(post.platform).toBe('reddit');
    expect(post.subreddit).toBe('r/reactjs');
  });

  it('scores every generated angle', () => {
    const post = generateCustomAngle(PROJECT, 'post-mortem');
    expect(post.algorithmScore.netScore).toBeGreaterThan(0);
    expect(post.linterChecks.length).toBeGreaterThan(0);
  });
});
