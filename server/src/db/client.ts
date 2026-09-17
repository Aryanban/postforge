import Database from 'better-sqlite3';
import { config } from '../config.js';

const SCHEMA = `
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
`;

let instance: Database.Database | null = null;

export function db(): Database.Database {
  if (instance) return instance;
  const conn = new Database(config.dbPath);
  conn.pragma('journal_mode = WAL');
  conn.pragma('foreign_keys = ON');
  conn.exec(SCHEMA);
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
