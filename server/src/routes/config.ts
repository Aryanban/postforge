import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config, providerConfigured } from '../config.js';
import { getCredential } from '../db/queries.js';
import { loadCredentials, storeCredentials } from '../credentials.js';

const CredentialSchema = z.object({
  provider: z.enum(['x', 'reddit', 'linkedin', 'gemini']),
  credentials: z.record(z.unknown()),
});

export async function configRoutes(app: FastifyInstance): Promise<void> {
  /** Reports which providers can dispatch right now — never returns secrets. */
  app.get('/config/status', async () => {
    const linkedinConnected = Boolean(getCredential('linkedin'));
    return {
      dryRun: config.dryRun,
      geminiConfigured: Boolean(config.geminiApiKey),
      providers: {
        x: providerConfigured('x') || Boolean(loadCredentials('x')),
        reddit: providerConfigured('reddit') || Boolean(loadCredentials('reddit')),
        linkedin: providerConfigured('linkedin') && linkedinConnected,
      },
    };
  });

  /** Stores provider keys in the encrypted vault (X / Reddit / Gemini). */
  app.put('/config/credentials', async (req, reply) => {
    const parsed = CredentialSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    storeCredentials(parsed.data.provider, parsed.data.credentials);
    return { ok: true };
  });
}
