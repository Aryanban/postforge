import type { PostItem, PostPerformance, ProjectProfile } from '@postforge/core';
import { db } from './client.js';
import { postToRow, projectToRow, rowToPost, rowToProject } from './mappers.js';

const UPSERT_PROJECT = `
INSERT INTO projects (id, domain, name, tagline, description, techStack, targetPersona, valueProps, simClusters, recommendedSubreddits, lastIngestedAt)
VALUES (@id, @domain, @name, @tagline, @description, @techStack, @targetPersona, @valueProps, @simClusters, @recommendedSubreddits, @lastIngestedAt)
ON CONFLICT(id) DO UPDATE SET
  domain=excluded.domain, name=excluded.name, tagline=excluded.tagline, description=excluded.description,
  techStack=excluded.techStack, targetPersona=excluded.targetPersona, valueProps=excluded.valueProps,
  simClusters=excluded.simClusters, recommendedSubreddits=excluded.recommendedSubreddits, lastIngestedAt=excluded.lastIngestedAt`;

const UPSERT_POST = `
INSERT INTO posts (id, projectId, platform, slot, framework, frameworkName, hook, mainContent, hasRootLink, replyContent, subreddit, scheduledDate, jitterMinutes, status, whyAlgorithmLikes, algorithmScore, linterChecks, postKind, threadParts, parentRemoteId, remoteId, dispatchedAt, simulated, error, attemptCount, createdAt)
VALUES (@id, @projectId, @platform, @slot, @framework, @frameworkName, @hook, @mainContent, @hasRootLink, @replyContent, @subreddit, @scheduledDate, @jitterMinutes, @status, @whyAlgorithmLikes, @algorithmScore, @linterChecks, @postKind, @threadParts, @parentRemoteId, @remoteId, @dispatchedAt, @simulated, @error, @attemptCount, @createdAt)
ON CONFLICT(id) DO UPDATE SET
  projectId=excluded.projectId, platform=excluded.platform, slot=excluded.slot, framework=excluded.framework,
  frameworkName=excluded.frameworkName, hook=excluded.hook, mainContent=excluded.mainContent, hasRootLink=excluded.hasRootLink,
  replyContent=excluded.replyContent, subreddit=excluded.subreddit, scheduledDate=excluded.scheduledDate,
  jitterMinutes=excluded.jitterMinutes, status=excluded.status, whyAlgorithmLikes=excluded.whyAlgorithmLikes,
  algorithmScore=excluded.algorithmScore, linterChecks=excluded.linterChecks, postKind=excluded.postKind,
  threadParts=excluded.threadParts, parentRemoteId=excluded.parentRemoteId, remoteId=excluded.remoteId,
  dispatchedAt=excluded.dispatchedAt, simulated=excluded.simulated, error=excluded.error, attemptCount=excluded.attemptCount`;

export function upsertProject(project: ProjectProfile): void {
  db().prepare(UPSERT_PROJECT).run(projectToRow(project));
}

export function listProjects(): ProjectProfile[] {
  return db()
    .prepare('SELECT * FROM projects ORDER BY lastIngestedAt DESC')
    .all()
    .map(r => rowToProject(r as never));
}

export function getProject(id: string): ProjectProfile | null {
  const row = db().prepare('SELECT * FROM projects WHERE id = ?').get(id) as never;
  return row ? rowToProject(row) : null;
}

export function upsertPost(post: PostItem): void {
  db().prepare(UPSERT_POST).run(postToRow(post));
}

export function getPost(id: string): PostItem | null {
  const row = db().prepare('SELECT * FROM posts WHERE id = ?').get(id) as never;
  return row ? rowToPost(row) : null;
}

export function listPosts(opts: { projectId?: string; status?: string } = {}): PostItem[] {
  const conditions: string[] = [];
  const params: string[] = [];
  if (opts.projectId) {
    conditions.push('projectId = ?');
    params.push(opts.projectId);
  }
  if (opts.status) {
    conditions.push('status = ?');
    params.push(opts.status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return db()
    .prepare(`SELECT * FROM posts ${where} ORDER BY scheduledDate ASC`)
    .all(...params)
    .map(r => rowToPost(r as never));
}

export function deletePost(id: string): void {
  db().prepare('DELETE FROM posts WHERE id = ?').run(id);
}

/**
 * Claims all posts that are due for dispatch and marks them in-flight, in a
 * single transaction so overlapping ticks can never double-dispatch.
 */
export function claimDuePosts(now: number): PostItem[] {
  const conn = db();
  const claim = conn.transaction(() => {
    const rows = conn
      .prepare(
        `SELECT * FROM posts
         WHERE status IN ('approved', 'scheduled')
           AND dispatchedAt IS NULL
           AND scheduledDate <= ?
         ORDER BY scheduledDate ASC`
      )
      .all(new Date(now).toISOString()) as never[];
    const claimed: PostItem[] = rows.map(rowToPost);
    for (const post of claimed) {
      conn.prepare(`UPDATE posts SET status = 'scheduled' WHERE id = ?`).run(post.id);
    }
    return claimed;
  });
  return claim();
}

export function markPublished(id: string, remoteId: string, simulated: boolean): void {
  db()
    .prepare(
      `UPDATE posts SET status = 'published', remoteId = ?, dispatchedAt = ?, simulated = ?, error = NULL WHERE id = ?`
    )
    .run(remoteId, new Date().toISOString(), simulated ? 1 : 0, id);
}

/** On failure: retry with exponential backoff (max 3 attempts) before giving up. */
export function markFailed(id: string, message: string): void {
  const conn = db();
  conn
    .transaction(() => {
      const row = conn.prepare('SELECT attemptCount FROM posts WHERE id = ?').get(id) as
        | { attemptCount: number }
        | undefined;
      const attempts = (row?.attemptCount ?? 0) + 1;
      if (attempts < 3) {
        const backoffMin = Math.pow(2, attempts - 1) * 5;
        const next = new Date(Date.now() + backoffMin * 60_000).toISOString();
        conn.prepare(
          `UPDATE posts SET status = 'approved', error = ?, attemptCount = ?, scheduledDate = ? WHERE id = ?`
        ).run(message, attempts, next, id);
      } else {
        conn.prepare(
          `UPDATE posts SET status = 'failed', error = ?, attemptCount = ? WHERE id = ?`
        ).run(message, attempts, id);
      }
    })();
}

export function insertLog(postId: string, provider: string, status: string, message: string): void {
  db()
    .prepare(
      `INSERT INTO dispatch_log (postId, provider, status, message, at) VALUES (?, ?, ?, ?, ?)`
    )
    .run(postId, provider, status, message, new Date().toISOString());
}

export function recentLogs(limit = 50): { id: number; postId: string; provider: string; status: string; message: string; at: string }[] {
  return db()
    .prepare('SELECT * FROM dispatch_log ORDER BY at DESC LIMIT ?')
    .all(limit)
    .map(r => r as never);
}

export function setCredential(provider: string, blob: string): void {
  db()
    .prepare(
      `INSERT INTO credentials (provider, blob, updatedAt) VALUES (?, ?, ?)
       ON CONFLICT(provider) DO UPDATE SET blob = excluded.blob, updatedAt = excluded.updatedAt`
    )
    .run(provider, blob, new Date().toISOString());
}

export function getCredential(provider: string): string | null {
  const row = db().prepare('SELECT blob FROM credentials WHERE provider = ?').get(provider) as
    | { blob: string }
    | undefined;
  return row?.blob ?? null;
}

/** Records what a dispatched post actually achieved (the feedback loop). */
export function upsertPerformance(entry: PostPerformance): void {
  // better-sqlite3 requires every named parameter to be present, so omitted
  // metrics are normalized to null rather than left undefined.
  const row = {
    postId: entry.postId,
    impressions: entry.impressions ?? null,
    likes: entry.likes ?? null,
    replies: entry.replies ?? null,
    bookmarks: entry.bookmarks ?? null,
    retweets: entry.retweets ?? null,
    notes: entry.notes ?? null,
    recordedAt: entry.recordedAt,
  };
  db()
    .prepare(
      `INSERT INTO post_performance (postId, impressions, likes, replies, bookmarks, retweets, notes, recordedAt)
       VALUES (@postId, @impressions, @likes, @replies, @bookmarks, @retweets, @notes, @recordedAt)
       ON CONFLICT(postId) DO UPDATE SET
         impressions=excluded.impressions, likes=excluded.likes, replies=excluded.replies,
         bookmarks=excluded.bookmarks, retweets=excluded.retweets, notes=excluded.notes,
         recordedAt=excluded.recordedAt`
    )
    .run(row);
}

export function getPerformance(postId: string): PostPerformance | null {
  const row = db()
    .prepare('SELECT * FROM post_performance WHERE postId = ?')
    .get(postId) as Partial<PostPerformance> | undefined;
  return row ? (row as PostPerformance) : null;
}

export function listPerformance(): PostPerformance[] {
  return db()
    .prepare('SELECT * FROM post_performance ORDER BY recordedAt DESC')
    .all()
    .map(r => r as PostPerformance);
}
