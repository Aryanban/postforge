import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  calculateHeavyRankerScore,
  generateCustomAngle,
  generateDailyPostBatch,
  lintPostContent,
  type PostItem,
} from '@postforge/core';
import {
  deletePost,
  getPost,
  getProject,
  insertLog,
  listPosts,
  markPublished,
  recentLogs,
  upsertPost,
} from '../db/queries.js';
import { dispatchPost, scheduleDelayedReply } from '../dispatch.js';

const PostSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    platform: z.enum(['x', 'reddit', 'linkedin']),
    slot: z.enum(['morning', 'evening', 'custom']),
    framework: z.string(),
    frameworkName: z.string(),
    hook: z.string(),
    mainContent: z.string(),
    replyContent: z.string().optional(),
    subreddit: z.string().optional(),
    scheduledDate: z.string(),
    jitterMinutes: z.number().optional(),
    status: z.enum(['draft', 'approved', 'scheduled', 'published', 'failed']).optional(),
    whyAlgorithmLikes: z.string().optional(),
    threadParts: z.array(z.string()).optional(),
    postKind: z.enum(['root', 'reply']).optional(),
    parentRemoteId: z.string().optional(),
  })
  .passthrough();

const GenerateSchema = z.object({
  projectId: z.string(),
  framework: z.string().optional(),
});

const EditSchema = z.object({
  mainContent: z.string().optional(),
  replyContent: z.string().optional(),
  scheduledDate: z.string().optional(),
});

/** Ensures every stored post carries a fresh Heavy Ranker score + linter pass. */
function normalize(post: PostItem): PostItem {
  const reply = post.replyContent ?? undefined;
  const hasScore = Boolean(post.algorithmScore && post.linterChecks);
  return {
    ...post,
    whyAlgorithmLikes: post.whyAlgorithmLikes ?? '',
    algorithmScore: hasScore
      ? post.algorithmScore
      : calculateHeavyRankerScore(post.mainContent, reply),
    linterChecks: hasScore
      ? post.linterChecks
      : lintPostContent(post.mainContent, reply).checks,
  };
}

export async function postRoutes(app: FastifyInstance): Promise<void> {
  app.post('/posts', async (req, reply) => {
    const parsed = PostSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    const post = normalize(parsed.data as unknown as PostItem);
    upsertPost(post);
    return post;
  });

  app.get('/posts', async (req) => {
    const { projectId, status } = req.query as { projectId?: string; status?: string };
    return listPosts({ projectId, status });
  });

  app.get('/posts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const post = getPost(id);
    if (!post) return reply.code(404).send({ error: 'post not found' });
    return post;
  });

  app.put('/posts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = getPost(id);
    if (!existing) return reply.code(404).send({ error: 'post not found' });

    const parsed = EditSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    const mainContent = parsed.data.mainContent ?? existing.mainContent;
    const replyContent = parsed.data.replyContent ?? existing.replyContent;
    const updated: PostItem = {
      ...existing,
      mainContent,
      replyContent,
      scheduledDate: parsed.data.scheduledDate ?? existing.scheduledDate,
      algorithmScore: calculateHeavyRankerScore(mainContent, replyContent),
      linterChecks: lintPostContent(mainContent, replyContent).checks,
    };
    upsertPost(updated);
    return updated;
  });

  app.delete('/posts/:id', async (req) => {
    const { id } = req.params as { id: string };
    deletePost(id);
    return { ok: true };
  });

  app.post('/posts/generate', async (req, reply) => {
    const parsed = GenerateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    const project = getProject(parsed.data.projectId);
    if (!project) return reply.code(404).send({ error: 'project not found' });

    const created: PostItem[] = parsed.data.framework
      ? [generateCustomAngle(project, parsed.data.framework)]
      : generateDailyPostBatch(project);
    created.forEach(upsertPost);
    return created;
  });

  app.post('/posts/:id/approve', async (req, reply) => {
    const { id } = req.params as { id: string };
    const post = getPost(id);
    if (!post) return reply.code(404).send({ error: 'post not found' });
    const approved = { ...post, status: 'approved' as const };
    upsertPost(approved);
    return approved;
  });

  /** Dispatch immediately, bypassing the scheduler (manual "send now"). */
  app.post('/posts/:id/dispatch', async (req, reply) => {
    const { id } = req.params as { id: string };
    const post = getPost(id);
    if (!post) return reply.code(404).send({ error: 'post not found' });
    try {
      const { remoteId, simulated } = await dispatchPost(post);
      markPublished(post.id, remoteId, simulated);
      insertLog(post.id, post.platform, 'success', simulated ? `simulated:${remoteId}` : remoteId);
      await scheduleDelayedReply(post, remoteId);
      return { ok: true, remoteId, simulated };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      insertLog(post.id, post.platform, 'error', message);
      return reply.code(502).send({ error: message });
    }
  });

  app.get('/dispatch/log', async (req) => {
    const raw = (req.query as { limit?: string }).limit;
    const limit = raw ? Math.min(Number(raw) || 50, 200) : 50;
    return recentLogs(limit);
  });
}
