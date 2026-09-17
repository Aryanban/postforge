import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AI_FRAMEWORKS, frameworkById, type PlatformType } from '@postforge/core';
import { config } from '../config.js';
import { getProject, upsertPost } from '../db/queries.js';
import { generateOptimizedPost } from '../ai/generateLoop.js';

const GenerateSchema = z.object({
  projectId: z.string(),
  framework: z.string(),
  platform: z.enum(['x', 'reddit', 'linkedin']).optional(),
});

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ai/frameworks', async () => AI_FRAMEWORKS);

  app.post('/posts/generate-ai', async (req, reply) => {
    const parsed = GenerateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    const { projectId, framework, platform = 'x' } = parsed.data;

    const project = getProject(projectId);
    if (!project) return reply.code(404).send({ error: 'project not found' });

    const known = frameworkById(framework);
    if (!known) {
      return reply.code(400).send({
        error: `unknown framework "${framework}"`,
        available: AI_FRAMEWORKS.map(f => f.id),
      });
    }
    if (!known.platforms.includes(platform as PlatformType)) {
      return reply.code(400).send({
        error: `framework "${framework}" does not support ${platform}`,
        supported: known.platforms,
      });
    }
    if (!config.geminiApiKey) {
      return reply
        .code(503)
        .send({ error: 'GEMINI_API_KEY is not configured on the server (template generation still works via /api/posts/generate).' });
    }

    try {
      const result = await generateOptimizedPost(project, framework, platform as PlatformType);
      upsertPost(result.post);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.code(502).send({ error: message });
    }
  });
}
