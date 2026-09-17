import type { PostItem } from '@postforge/core';
import { claimDuePosts, insertLog, markFailed, markPublished } from '../db/queries.js';
import { dispatchPost, scheduleDelayedReply } from '../dispatch.js';

const TICK_MS = 30_000;

/**
 * Background dispatch loop. Wakes every 30s, claims every post whose jittered
 * scheduled time has arrived, ships it, and enqueues any delayed reply.
 */
export function startScheduler(): void {
  const tick = async () => {
    try {
      await runTick();
    } catch (err) {
      console.error('[scheduler] tick failed:', err);
    }
  };
  void tick(); // run once immediately so boot doesn't wait for the first interval
  setInterval(() => void tick(), TICK_MS);
}

async function runTick(): Promise<void> {
  const due = claimDuePosts(Date.now());
  if (due.length === 0) return;
  for (const post of due) {
    await dispatchFlow(post);
  }
}

async function dispatchFlow(post: PostItem): Promise<void> {
  try {
    const { remoteId, simulated } = await dispatchPost(post);
    markPublished(post.id, remoteId, simulated);
    insertLog(post.id, post.platform, 'success', simulated ? `simulated:${remoteId}` : remoteId);
    await scheduleDelayedReply(post, remoteId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markFailed(post.id, message);
    insertLog(post.id, post.platform, 'error', message);
  }
}
