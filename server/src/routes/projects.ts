import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ingestProjectUrl } from '@postforge/core';
import { getProject, listProjects, upsertProject } from '../db/queries.js';

const IngestSchema = z.object({
  url: z.string().min(1),
});

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.post('/projects/ingest', async (req, reply) => {
    const parsed = IngestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'url is required' });
    }
    try {
      const profile = await ingestProjectUrl(parsed.data.url);
      upsertProject(profile);
      return profile;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.code(502).send({ error: message });
    }
  });

  app.get('/projects', async () => listProjects());

  app.get('/projects/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = getProject(id);
    if (!project) return reply.code(404).send({ error: 'project not found' });
    return project;
  });
}
