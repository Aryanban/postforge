import { describe, it, expect } from 'vitest';
import { calculateSimClusterAlignment, extractProjectKeywords } from './simClusterAligner';
import type { ProjectProfile } from '../types';

const PROJECT: ProjectProfile = {
  id: 'demo',
  domain: 'demo.com',
  name: 'Demo Platform',
  tagline: 'A react and typescript platform',
  description: 'We build react interfaces with typescript for developers.',
  techStack: ['React', 'TypeScript', 'Vite'],
  targetPersona: 'developers',
  valueProps: ['zero-latency react rendering', 'typescript-first apis'],
  simClusters: ['Frontend Architecture', 'React Developers'],
  recommendedSubreddits: ['r/reactjs'],
  lastIngestedAt: new Date().toISOString(),
};

describe('extractProjectKeywords', () => {
  it('harvests vocabulary from the ingested project', () => {
    const keywords = extractProjectKeywords(PROJECT);
    expect(keywords).toContain('react');
    expect(keywords).toContain('typescript');
    expect(keywords.length).toBeGreaterThan(0);
  });
});

describe('calculateSimClusterAlignment', () => {
  it('returns a neutral default without keywords', () => {
    expect(calculateSimClusterAlignment('anything goes here')).toBe(70);
  });

  it('rises with vocabulary coverage', () => {
    const keywords = extractProjectKeywords(PROJECT);
    const low = calculateSimClusterAlignment('gardening and cooking recipes', keywords);
    const high = calculateSimClusterAlignment('react typescript vite for developers', keywords);
    expect(high).toBeGreaterThan(low);
  });

  it('stays within the 35-100 band', () => {
    const keywords = extractProjectKeywords(PROJECT);
    const score = calculateSimClusterAlignment('react', keywords);
    expect(score).toBeGreaterThanOrEqual(35);
    expect(score).toBeLessThanOrEqual(100);
  });
});
