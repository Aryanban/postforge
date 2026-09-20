import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

process.env.DATABASE_PATH = join(tmpdir(), `postforge-perf-${Date.now()}.db`);

const { db } = await import('./client.js');
const { upsertPerformance, getPerformance, listPerformance } = await import('./queries.js');

describe('post_performance feedback loop', () => {
  afterAll(() => {
    try {
      rmSync(process.env.DATABASE_PATH as string, { force: true });
    } catch {
      /* temp cleanup best-effort */
    }
  });

  beforeAll(() => {
    db(); // materialize schema
  });

  it('records and reads back a performance entry', () => {
    upsertPerformance({
      postId: 'post-a',
      impressions: 12000,
      likes: 340,
      replies: 88,
      bookmarks: 210,
      recordedAt: new Date().toISOString(),
    });

    const read = getPerformance('post-a');
    expect(read?.impressions).toBe(12000);
    expect(read?.replies).toBe(88);
    expect(read?.bookmarks).toBe(210);
  });

  it('upserts — re-recording overwrites the previous numbers', () => {
    upsertPerformance({
      postId: 'post-b',
      impressions: 100,
      recordedAt: new Date().toISOString(),
    });
    upsertPerformance({
      postId: 'post-b',
      impressions: 999,
      likes: 5,
      recordedAt: new Date().toISOString(),
    });

    const read = getPerformance('post-b');
    expect(read?.impressions).toBe(999);
    expect(read?.likes).toBe(5);
  });

  it('returns null for posts with no recorded performance', () => {
    expect(getPerformance('does-not-exist')).toBeNull();
  });

  it('lists every recorded entry', () => {
    upsertPerformance({
      postId: 'post-c',
      impressions: 50,
      recordedAt: new Date().toISOString(),
    });
    const all = listPerformance();
    expect(all.map(e => e.postId)).toEqual(expect.arrayContaining(['post-a', 'post-b', 'post-c']));
  });
});
