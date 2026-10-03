import { describe, it, expect } from 'vitest';
import { generateCarouselDeck, generateSvgSlide } from './carouselGenerator';

describe('carouselGenerator', () => {
  it('generates structured LinkedIn carousel deck with cover and CTA slides', () => {
    const text = `
# How We Shipped Fast
1. Architecture First: Define strict schema interfaces and API boundaries before coding.
2. Local Verification: Run end-to-end and unit tests locally before pushing to git.
3. Continuous Deployment: Ship atomic, self-contained PRs with zero downtime.
    `.trim();

    const deck = generateCarouselDeck(text, {
      title: 'How We Shipped Fast',
      authorName: 'Aryan Bansal',
      authorHandle: '@Aryanban',
    });

    expect(deck.length).toBeGreaterThanOrEqual(3);
    
    // First slide is Cover
    expect(deck[0].slideNumber).toBe(1);
    expect(deck[0].isCover).toBe(true);
    expect(deck[0].title).toBe('How We Shipped Fast');

    // Last slide is Outro CTA
    const last = deck[deck.length - 1];
    expect(last.isCta).toBe(true);
    expect(last.slideNumber).toBe(deck.length);
    expect(last.title).toBe('Found this valuable?');

    // Middle slides are content
    expect(deck[1].slideNumber).toBe(2);
    expect(deck[1].isCover).toBeFalsy();
    expect(deck[1].isCta).toBeFalsy();
    expect(deck[1].bulletPoints?.length).toBeGreaterThan(0);
  });

  it('generates 1080x1350 portrait SVG for slides', () => {
    const deck = generateCarouselDeck('Simple post about systems engineering.');
    const coverSvg = generateSvgSlide(deck[0], { authorName: 'Aryan Bansal', authorHandle: '@Aryanban' });
    
    expect(coverSvg).toContain('viewBox="0 0 1080 1350"');
    expect(coverSvg).toContain('Aryan Bansal');
    expect(coverSvg).toContain('@Aryanban');
    expect(coverSvg).toContain('POSTFORGE • ZERO-KEY OPEN SOURCE');

    expect(coverSvg).toContain('1 / ');

    const contentSvg = generateSvgSlide(deck[1], { brandColor: '#10b981' });
    expect(contentSvg).toContain('viewBox="0 0 1080 1350"');
    expect(contentSvg).toContain('2 / ');
  });
});
