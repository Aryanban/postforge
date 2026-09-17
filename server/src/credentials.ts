import { config, type XCreds, type RedditCreds } from './config.js';
import { getCredential, setCredential } from './db/queries.js';
import { decrypt, encrypt } from './vault.js';

/** Encrypts and persists credentials captured at runtime (the API vault). */
export function storeCredentials(provider: string, data: unknown): void {
  setCredential(provider, encrypt(JSON.stringify(data)));
}

export function loadCredentials<T>(provider: string): T | null {
  const blob = getCredential(provider);
  if (!blob) return null;
  try {
    return JSON.parse(decrypt(blob)) as T;
  } catch {
    return null;
  }
}

export function resolveX(): XCreds {
  const stored = loadCredentials<XCreds>('x');
  if (stored) return stored;
  if (config.providers.x) return config.providers.x;
  throw new Error(
    'X credentials are not configured. Add them via PUT /api/config/credentials or set X_* in server/.env.'
  );
}

export function resolveReddit(): RedditCreds {
  const stored = loadCredentials<RedditCreds>('reddit');
  if (stored) return stored;
  if (config.providers.reddit) return config.providers.reddit;
  throw new Error(
    'Reddit credentials are not configured. Add them via PUT /api/config/credentials or set REDDIT_* in server/.env.'
  );
}
