import { describe, it, expect } from 'vitest';
import { synthesizeProfileFromCrawl, type CrawledDomain } from './domCrawler';

function fakeCrawl(overrides: Partial<CrawledDomain> = {}): CrawledDomain {
  return {
    url: 'https://demo.com',
    domain: 'demo.com',
    title: 'Demo — Build React Apps Fast',
    description: 'The fastest way to build React and TypeScript applications.',
    keywords: ['react', 'typescript', 'components'],
    headings: ['Build React Apps Fast', 'Zero-config TypeScript', 'Deploy in seconds'],
    paragraphs: ['Demo lets teams ship React interfaces without boilerplate.'],
    jsonLd: [],
    techFingerprints: ['Next.js', 'React', 'Tailwind CSS'],
    ...overrides,
  };
}

describe('synthesizeProfileFromCrawl', () => {
  it('carries the real domain, title, and description from the crawl', () => {
    const profile = synthesizeProfileFromCrawl(fakeCrawl());
    expect(profile.domain).toBe('demo.com');
    expect(profile.name).toBe('Demo — Build React Apps Fast');
    expect(profile.tagline).toContain('React and TypeScript');
  });

  it('derives the tech stack from detected fingerprints', () => {
    const profile = synthesizeProfileFromCrawl(fakeCrawl());
    expect(profile.techStack).toEqual(['Next.js', 'React', 'Tailwind CSS']);
  });

  it('falls back to corpus terms when no fingerprints are found', () => {
    const profile = synthesizeProfileFromCrawl(fakeCrawl({ techFingerprints: [] }));
    expect(profile.techStack.length).toBeGreaterThan(0);
  });

  it('turns crawled headings into value props', () => {
    const profile = synthesizeProfileFromCrawl(fakeCrawl());
    expect(profile.valueProps).toContain('Zero-config TypeScript');
  });

  it('never fabricates an unrelated simCluster', () => {
    const profile = synthesizeProfileFromCrawl(fakeCrawl());
    expect(profile.simClusters).toContain('Web Development');
    expect(profile.simClusters.length).toBeLessThanOrEqual(4);
  });
});
