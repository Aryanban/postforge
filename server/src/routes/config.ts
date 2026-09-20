import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config, providerConfigured } from '../config.js';
import { getCredential } from '../db/queries.js';
import { loadCredentials, storeCredentials } from '../credentials.js';

/**
 * Exact shape per provider. A request must carry every field the provider's
 * dispatch path actually reads, so a half-entered key set is rejected up front
 * instead of failing later at dispatch time.
 */
const CREDENTIAL_SCHEMAS = {
  x: z.object({
    appKey: z.string().min(1),
    appSecret: z.string().min(1),
    accessToken: z.string().min(1),
    accessSecret: z.string().min(1),
  }),
  reddit: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
  }),
  linkedin: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    redirectUri: z.string().min(1),
  }),
  gemini: z.object({
    apiKey: z.string().min(1),
  }),
} as const;

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

  /** Stores provider keys in the encrypted vault (X / Reddit / LinkedIn / Gemini). */
  app.put('/config/credentials', async (req, reply) => {
    const parsed = CredentialSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    const { provider, credentials } = parsed.data;
    const validated = CREDENTIAL_SCHEMAS[provider].safeParse(credentials);
    if (!validated.success) {
      return reply.code(400).send({
        error: `invalid ${provider} credentials`,
        details: validated.error.flatten().fieldErrors,
      });
    }
    storeCredentials(provider, validated.data);
    return { ok: true };
  });
}
