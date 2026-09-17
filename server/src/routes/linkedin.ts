import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { config, requireCreds, type LinkedInCreds } from '../config.js';
import {
  authorizationUrl,
  exchangeCode,
  getUserInfo,
  type StoredLinkedInToken,
} from '../providers/linkedin.js';
import { storeCredentials } from '../credentials.js';

/** Single-use OAuth states, kept in memory (single-user server). */
const pendingStates = new Set<string>();

function forget(state: string): void {
  setTimeout(() => pendingStates.delete(state), 10 * 60_000);
}

export async function linkedinRoutes(app: FastifyInstance): Promise<void> {
  app.get('/auth/linkedin', async (req, reply) => {
    const creds = requireCreds('linkedin') as LinkedInCreds;
    const state = randomBytes(16).toString('hex');
    pendingStates.add(state);
    forget(state);
    return reply.redirect(authorizationUrl(creds, state));
  });

  app.get('/auth/linkedin/callback', async (req, reply) => {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    if (error) {
      return reply.redirect(
        `${config.frontendOrigin}?linkedin_error=${encodeURIComponent(error)}`
      );
    }
    if (!code || !state || !pendingStates.has(state)) {
      return reply.code(400).send({ error: 'invalid linkedin oauth state' });
    }
    pendingStates.delete(state);

    const creds = requireCreds('linkedin') as LinkedInCreds;
    try {
      const { access_token, expires_in } = await exchangeCode(creds, code);
      const user = await getUserInfo(access_token);
      const stored: StoredLinkedInToken = {
        accessToken: access_token,
        memberId: user.sub,
        name: user.name,
        expiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000).toISOString()
          : undefined,
      };
      storeCredentials('linkedin', stored);
      return reply.redirect(`${config.frontendOrigin}?linkedin_connected=1`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.redirect(
        `${config.frontendOrigin}?linkedin_error=${encodeURIComponent(message)}`
      );
    }
  });
}
