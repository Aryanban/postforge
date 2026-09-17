import type { PostItem } from '@postforge/core';
import { config, requireCreds } from './config.js';
import { decrypt } from './vault.js';
import { getCredential, getPost, upsertPost } from './db/queries.js';
import { resolveX, resolveReddit } from './credentials.js';
import * as xProvider from './providers/x.js';
import * as redditProvider from './providers/reddit.js';
import * as linkedinProvider from './providers/linkedin.js';
import type { StoredLinkedInToken } from './providers/linkedin.js';

export interface DispatchResult {
  remoteId: string;
  simulated: boolean;
}

const REPLY_DELAY_MINUTES = 15;
const URL_RE = /https?:\/\//i;

/**
 * Routes a post to its platform. In DRY_RUN mode every provider is simulated,
 * so the whole pipeline is exercisable without paid API keys.
 */
export async function dispatchPost(post: PostItem): Promise<DispatchResult> {
  if (config.dryRun) {
    return { remoteId: `sim_${post.id}`, simulated: true };
  }
  switch (post.platform) {
    case 'x':
      return { remoteId: await dispatchX(post), simulated: false };
    case 'reddit':
      return { remoteId: await dispatchReddit(post), simulated: false };
    case 'linkedin':
      return { remoteId: await dispatchLinkedIn(post), simulated: false };
    default:
      throw new Error(`unsupported platform: ${post.platform as never}`);
  }
}

async function dispatchX(post: PostItem): Promise<string> {
  const creds = resolveX();
  if (post.threadParts && post.threadParts.length > 1) {
    const ids = await xProvider.postThread(creds, post.threadParts);
    return ids[0];
  }
  if (post.postKind === 'reply' && post.parentRemoteId) {
    return xProvider.replyTweet(creds, post.mainContent, post.parentRemoteId);
  }
  return xProvider.postTweet(creds, post.mainContent);
}

async function dispatchReddit(post: PostItem): Promise<string> {
  const creds = resolveReddit();
  if (post.postKind === 'reply' && post.parentRemoteId) {
    return redditProvider.postComment(creds, {
      parentId: post.parentRemoteId,
      text: post.mainContent,
    });
  }
  return redditProvider.submitSelfPost(creds, {
    subreddit: post.subreddit || 'SideProject',
    title: post.hook,
    text: post.mainContent,
  });
}

async function dispatchLinkedIn(post: PostItem): Promise<string> {
  requireCreds('linkedin');
  const blob = getCredential('linkedin');
  if (!blob) {
    throw new Error('LinkedIn account not connected — complete OAuth at /api/auth/linkedin first.');
  }
  const token = JSON.parse(decrypt(blob)) as StoredLinkedInToken;
  return linkedinProvider.createTextPost(token.accessToken, token.memberId, post.mainContent);
}

/**
 * After a root post ships, enqueue the quarantined link as a delayed first
 * reply (+15 min) chained to the live parent id. Idempotent. LinkedIn has no
 * equivalent concept, so it is skipped there.
 */
export async function scheduleDelayedReply(parent: PostItem, remoteId: string): Promise<void> {
  if (parent.postKind === 'reply') return;
  if (!parent.replyContent) return;
  if (parent.platform === 'linkedin') return;

  const replyId = `${parent.id}-reply`;
  if (getPost(replyId)) return;

  const reply: PostItem = {
    id: replyId,
    projectId: parent.projectId,
    platform: parent.platform,
    slot: 'custom',
    framework: 'delayed-reply',
    frameworkName: 'Delayed 1st Reply',
    hook: parent.replyContent.split('\n')[0],
    mainContent: parent.replyContent,
    hasRootLink: URL_RE.test(parent.replyContent),
    subreddit: parent.subreddit,
    scheduledDate: new Date(Date.now() + REPLY_DELAY_MINUTES * 60_000).toISOString(),
    jitterMinutes: 0,
    status: 'approved',
    whyAlgorithmLikes:
      'Quarantined link deployed as a delayed first reply so the root post keeps full algorithmic distribution.',
    algorithmScore: parent.algorithmScore,
    linterChecks: parent.linterChecks,
    postKind: 'reply',
    parentRemoteId: remoteId,
  };
  upsertPost(reply);
}
