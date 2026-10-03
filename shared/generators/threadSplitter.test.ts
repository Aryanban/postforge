import { describe, it, expect } from 'vitest';
import { splitIntoThread } from './threadSplitter';
import { generateCarouselDeck, generateSvgSlide } from './carouselGenerator';

describe('Thread Splitter', () => {
  it('keeps short text as a single post without numbering', () => {
    const text = 'Just shipped PostForge 2.0 with zero API key requirement!';
    const thread = splitIntoThread(text);
    expect(thread.length).toBe(1);
    expect(thread[0]).toBe(text);
  });

  it('splits long paragraph text into clean numbered chunks under 280 characters', () => {
    const longText = `
      Most developers overcomplicate their software architecture by pulling in 50 different third-party SaaS services and paying thousands per month.

      Instead, you can run everything locally with zero cloud subscription fees.

      Here is how we architected PostForge:
      1. Local embedded SQLite storage for instant sub-millisecond queries.
      2. Native multi-platform scrapers without paid proxy dependencies.
      3. Deterministic algorithm heuristics that emulate social ranking mechanics accurately.

      When you remove artificial cloud limits, your software runs 10x faster and never breaks when an external API changes their pricing.
    `;

    const thread = splitIntoThread(longText, { maxChars: 250, addNumbering: true });
    expect(thread.length).toBeGreaterThan(1);
    thread.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(280);
    });
    expect(thread[0]).toContain(`(1/${thread.length})`);
    expect(thread[thread.length - 1]).toContain(`(${thread.length}/${thread.length})`);
  });

  it('adds an optional outro call-to-action post', () => {
    const text = 'Point 1: Architecture\n\nPoint 2: State management\n\nPoint 3: Performance tuning';
    const thread = splitIntoThread(text, { includeOutroCta: true });
    expect(thread[thread.length - 1]).toContain('Follow for more');
  });
});

describe('LinkedIn Carousel Generator', () => {
  it('converts bulleted content into a complete multi-slide deck', () => {
    const text = `
      10 Rules for Clean Backend Architecture

      Rule 1: Never leak database models into public API schemas
      Rule 2: Enforce idempotency on all mutating endpoints
      Rule 3: Keep background worker tasks idempotent and retriable
      Rule 4: Log structured JSON instead of unstructured strings
    `;

    const deck = generateCarouselDeck(text, { authorName: 'Aryan Bansal', handle: '@Aryanban' });
    expect(deck.length).toBeGreaterThanOrEqual(3);
    expect(deck[0].isCover).toBe(true);
    expect(deck[deck.length - 1].isCta).toBe(true);
    expect(deck[0].slideNumber).toBe(1);
    expect(deck[deck.length - 1].slideNumber).toBe(deck.length);
  });

  it('generates valid SVG markup for slides', () => {
    const deck = generateCarouselDeck('Fast Systems: Keep state local\nOptimize database indexes');
    const svg = generateSvgSlide(deck[0]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('1080');
    expect(svg).toContain('1350');
  });
});
