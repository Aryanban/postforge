import { describe, it, expect } from 'vitest';
import { lintPostContent, autoFixForAlgorithm } from './shadowbanLinter';

const GOOD_POST = `Most developers overcomplicate state management.

Here is the exact pattern we used:

• zero external dependencies
• single source of truth

What is your #1 rule for keeping state clean?`;

describe('lintPostContent (7-point shield)', () => {
  it('passes a clean, formatted, quarantined draft', () => {
    const result = lintPostContent(GOOD_POST, 'Live build: https://example.com');
    expect(result.hasCritical).toBe(false);
  });

  it('flags a root link as critical', () => {
    const result = lintPostContent(`see https://example.com now`);
    expect(result.hasCritical).toBe(true);
    expect(result.checks.some(c => c.id === 'root-link' && c.severity === 'critical')).toBe(true);
  });

  it('flags hashtag spam as critical', () => {
    const result = lintPostContent(`ship it #saas #startup #ai`);
    expect(result.checks.some(c => c.id === 'hashtag-spam' && c.severity === 'critical')).toBe(true);
  });

  it('warns on walls of text', () => {
    const wall = 'word '.repeat(60).trim();
    const result = lintPostContent(wall);
    expect(result.checks.some(c => c.id === 'wall-of-text' && c.severity === 'warning')).toBe(true);
  });

  it('runs all seven heuristics, including SimCluster consistency', () => {
    const result = lintPostContent(GOOD_POST, undefined, {
      keywords: ['react', 'typescript', 'state'],
    });
    const ids = result.checks.map(c => c.id);
    expect(ids).toContain('root-link');
    expect(ids).toContain('hashtag-spam');
    expect(ids).toContain('wall-of-text');
    expect(ids).toContain('spam-heuristics');
    expect(ids).toContain('char-limit');
    expect(ids).toContain('simcluster-alignment');
    expect(result.checks.filter(c => c.id === 'simcluster-alignment')).toHaveLength(1);
  });

  it('warns when the copy drifts from the target vocabulary', () => {
    const aligned = lintPostContent('react typescript state management', undefined, {
      keywords: ['react', 'typescript', 'state'],
    });
    const drifted = lintPostContent('gardening cooking recipes', undefined, {
      keywords: ['react', 'typescript', 'state'],
    });
    const alignedCheck = aligned.checks.find(c => c.id === 'simcluster-alignment');
    const driftedCheck = drifted.checks.find(c => c.id === 'simcluster-alignment');
    expect(alignedCheck?.severity).toBe('pass');
    expect(driftedCheck?.severity).toBe('warning');
  });
});

describe('autoFixForAlgorithm', () => {
  it('quarantines the root URL into a reply', () => {
    const { fixedContent, replyContent } = autoFixForAlgorithm(
      `Built a thing: https://example.com — thoughts?`
    );
    expect(fixedContent).not.toContain('https://example.com');
    expect(replyContent).toContain('https://example.com');
  });

  it('strips excess hashtags but keeps at most one', () => {
    const { fixedContent } = autoFixForAlgorithm(`ship #saas #startup #ai now`);
    const remaining = (fixedContent.match(/#/g) ?? []).length;
    expect(remaining).toBeLessThanOrEqual(1);
  });
});
