import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config } from './config.js';

/**
 * Server-side credential vault.
 *
 * Secrets captured at runtime (e.g. LinkedIn access tokens) are encrypted at
 * rest with AES-256-GCM. The key is derived from VAULT_ENCRYPTION_KEY via
 * PBKDF2; when that env var is absent a random key is generated and persisted
 * to ./data/vault.key (0600) so restarts remain able to decrypt.
 */
const KEY_FILE = join(dirname(config.dbPath), 'vault.key');
const SALT = 'postforge-vault-salt-v1';
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;

function deriveKey(): Buffer {
  if (config.vaultKey) {
    return pbkdf2Sync(config.vaultKey, SALT, 100_000, KEY_LEN, 'sha256');
  }
  if (!existsSync(KEY_FILE)) {
    mkdirSync(dirname(KEY_FILE), { recursive: true });
    writeFileSync(KEY_FILE, randomBytes(KEY_LEN), { mode: 0o600 });
  }
  return readFileSync(KEY_FILE);
}

let cachedKey: Buffer | null = null;
function key(): Buffer {
  if (!cachedKey) cachedKey = deriveKey();
  return cachedKey;
}

export function encrypt(plain: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher: CipherGCM = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(blob: string): string {
  const buf = Buffer.from(blob, 'base64');
  if (buf.length < IV_LEN + TAG_LEN + 1) throw new Error('malformed vault blob');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher: DecipherGCM = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
