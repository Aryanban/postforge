import dotenv from 'dotenv';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { localTimezone } from '@postforge/core';

dotenv.config();

const dbPath = process.env.DATABASE_PATH ?? './data/postforge.db';
mkdirSync(dirname(dbPath), { recursive: true });

export type ProviderName = 'x' | 'reddit' | 'linkedin';

export interface XCreds {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}
export interface RedditCreds {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}
export interface LinkedInCreds {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function env(key: string): string {
  return (process.env[key] ?? '').trim();
}

function parseXCreds(): XCreds | null {
  const c = {
    appKey: env('X_API_KEY'),
    appSecret: env('X_API_SECRET'),
    accessToken: env('X_ACCESS_TOKEN'),
    accessSecret: env('X_ACCESS_TOKEN_SECRET'),
  };
  return Object.values(c).every(v => v.length > 0) ? c : null;
}

function parseRedditCreds(): RedditCreds | null {
  const c = {
    clientId: env('REDDIT_CLIENT_ID'),
    clientSecret: env('REDDIT_CLIENT_SECRET'),
    username: env('REDDIT_USERNAME'),
    password: env('REDDIT_PASSWORD'),
  };
  return Object.values(c).every(v => v.length > 0) ? c : null;
}

function parseLinkedInCreds(): LinkedInCreds | null {
  const c = {
    clientId: env('LINKEDIN_CLIENT_ID'),
    clientSecret: env('LINKEDIN_CLIENT_SECRET'),
    redirectUri: env('LINKEDIN_REDIRECT_URI') || 'http://localhost:3001/api/auth/linkedin/callback',
  };
  return c.clientId.length > 0 && c.clientSecret.length > 0 ? c : null;
}

export const config = {
  port: Number(env('PORT') || '3001'),
  /**
   * Binds to the loopback interface by default. PostForge is a single-user
   * tool with no authentication layer, so listening on 0.0.0.0 would expose
   * the vault-credential endpoints to your whole network. Override HOST only
   * behind a reverse proxy that adds auth (see the README deployment notes).
   */
  host: env('HOST') || '127.0.0.1',
  frontendOrigin: env('FRONTEND_ORIGIN') || 'http://localhost:5173',
  dbPath,
  /** IANA zone whose audience the schedule targets; defaults to the host's. */
  timezone: env('TIMEZONE') || localTimezone(),
  /** When true the full pipeline runs but dispatch is simulated (no paid API calls). */
  dryRun: env('DRY_RUN').toLowerCase() !== 'false',
  vaultKey: env('VAULT_ENCRYPTION_KEY'),
  geminiApiKey: env('GEMINI_API_KEY'),
  providers: {
    x: parseXCreds(),
    reddit: parseRedditCreds(),
    linkedin: parseLinkedInCreds(),
  },
};

export function providerConfigured(provider: ProviderName): boolean {
  return config.providers[provider] !== null;
}

export function configuredProviders(): Record<ProviderName, boolean> {
  return {
    x: providerConfigured('x'),
    reddit: providerConfigured('reddit'),
    linkedin: providerConfigured('linkedin'),
  };
}

export function requireCreds(provider: ProviderName): never | XCreds | RedditCreds | LinkedInCreds {
  const creds = config.providers[provider];
  if (!creds) {
    throw new Error(
      `${provider} credentials are not configured. Set them in server/.env (or set DRY_RUN=true) to simulate dispatch.`
    );
  }
  return creds;
}
