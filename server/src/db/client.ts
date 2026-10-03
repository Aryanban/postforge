import Database from 'better-sqlite3';
import { config } from '../config.js';

/**
 * Versioned migrations. The schema is built from empty and evolved forward;
 * each entry is applied exactly once, tracked by the `schema_version` row in
 * the `meta` table. This replaces the previous `CREATE TABLE IF NOT EXISTS`
 * approach, which could not alter existing tables once they existed.
 *
 * Add a new numbered entry for any schema change; never edit a shipped one.
 */
const MIGRATIONS: { version: number; name: string; sql: string }[] = [
  {
    version: 1,
    name: 'initial schema',
    sql: `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        name TEXT NOT NULL,
        tagline TEXT NOT NULL,
        description TEXT NOT NULL,
        techStack TEXT NOT NULL,
        targetPersona TEXT NOT NULL,
        valueProps TEXT NOT NULL,
        simClusters TEXT NOT NULL,
        recommendedSubreddits TEXT NOT NULL,
        lastIngestedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        platform TEXT NOT NULL,
        slot TEXT NOT NULL,
        framework TEXT NOT NULL,
        frameworkName TEXT NOT NULL,
        hook TEXT NOT NULL,
        mainContent TEXT NOT NULL,
        hasRootLink INTEGER NOT NULL DEFAULT 0,
        replyContent TEXT,
        subreddit TEXT,
        scheduledDate TEXT NOT NULL,
        jitterMinutes INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        whyAlgorithmLikes TEXT NOT NULL DEFAULT '',
        algorithmScore TEXT NOT NULL DEFAULT '{}',
        linterChecks TEXT NOT NULL DEFAULT '[]',
        postKind TEXT NOT NULL DEFAULT 'root',
        threadParts TEXT,
        parentRemoteId TEXT,
        remoteId TEXT,
        dispatchedAt TEXT,
        simulated INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        attemptCount INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduledDate, status, dispatchedAt);
      CREATE INDEX IF NOT EXISTS idx_posts_project ON posts(projectId);

      CREATE TABLE IF NOT EXISTS dispatch_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        postId TEXT NOT NULL,
        provider TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_log_post ON dispatch_log(postId, at DESC);

      CREATE TABLE IF NOT EXISTS credentials (
        provider TEXT PRIMARY KEY,
        blob TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS post_performance (
        postId TEXT PRIMARY KEY,
        impressions INTEGER,
        likes INTEGER,
        replies INTEGER,
        bookmarks INTEGER,
        retweets INTEGER,
        notes TEXT,
        recordedAt TEXT NOT NULL
      );
    `,
  },
];

/** Applies every pending migration inside a single transaction. */
function migrate(conn: Database.Database): void {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const current = (() => {
    const row = conn.prepare('SELECT value FROM meta WHERE key = ?').get('schema_version') as
      | { value: string }
      | undefined;
    return row ? Number(row.value) : 0;
  })();

  const pending = MIGRATIONS.filter(m => m.version > current).sort((a, b) => a.version - b.version);
  if (pending.length === 0) return;

  conn.transaction(() => {
    for (const m of pending) {
      conn.exec(m.sql);
      conn
        .prepare(
          `INSERT INTO meta (key, value) VALUES ('schema_version', ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`
        )
        .run(String(m.version));
    }
  })();

  // eslint-disable-next-line no-console
  console.info(
    `[postforge] schema migrated ${current} -> ${pending[pending.length - 1].version} ` +
      `(${pending.map(m => m.name).join(', ')})`
  );
}

let instance: Database.Database | null = null;

export function db(): Database.Database {
  if (instance) return instance;
  const conn = new Database(config.dbPath);
  conn.pragma('journal_mode = WAL');
  conn.pragma('foreign_keys = ON');
  migrate(conn);
  instance = conn;
  return conn;
}

export type PostRow = {
  id: string;
  projectId: string;
  platform: string;
  slot: string;
  framework: string;
  frameworkName: string;
  hook: string;
  mainContent: string;
  hasRootLink: number;
  replyContent: string | null;
  subreddit: string | null;
  scheduledDate: string;
  jitterMinutes: number;
  status: string;
  whyAlgorithmLikes: string;
  algorithmScore: string;
  linterChecks: string;
  postKind: string | null;
  threadParts: string | null;
  parentRemoteId: string | null;
  remoteId: string | null;
  dispatchedAt: string | null;
  simulated: number;
  error: string | null;
  attemptCount: number;
  createdAt: string;
};

export type ProjectRow = {
  id: string;
  domain: string;
  name: string;
  tagline: string;
  description: string;
  techStack: string;
  targetPersona: string;
  valueProps: string;
  simClusters: string;
  recommendedSubreddits: string;
  lastIngestedAt: string;
};
