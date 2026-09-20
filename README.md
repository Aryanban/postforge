# PostForge • Algorithm-Native Social Growth Engine

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-lime.svg?style=for-the-badge" alt="License MIT" />
  <img src="https://img.shields.io/badge/Algorithm-X%20Heavy%20Ranker-black?style=for-the-badge&logo=x" alt="X Algorithm" />
  <img src="https://img.shields.io/badge/Stack-React%2019%20%7C%20Fastify%20%7C%20MCP-indigo?style=for-the-badge" alt="Stack" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome" />
</p>

> **The open-source, algorithm-aware growth engine for X, Reddit, and LinkedIn.**
> A full-stack monorepo: a React 19 studio, a Fastify dispatch + scheduling backend,
> a Model Context Protocol server, and a shared TypeScript core that scores every
> draft against the real parameters of `twitter/the-algorithm` before it ships.

---

## What PostForge Actually Does

Most scheduling tools are **dumb queues** — they publish whatever you write, whenever
you tell them. PostForge is a **creator-side pre-flight system**:

1. **Ingest** a domain or GitHub repo (real DOM crawling with cheerio + the GitHub API).
2. **Generate** posts with Gemini — each one scored in a loop by the real Heavy Ranker
   math until it clears the threshold, or falls back to zero-dependency templates.
3. **Lint** every draft against a 7-point anti-shadowban shield.
4. **Schedule** with humanized jitter, and **dispatch for real** to X, Reddit, and
   LinkedIn — including the delayed first reply that quarantines your link out of the
   root post to dodge the -50% distribution penalty.

### Honest about keys

PostForge ships in **dry-run mode by default**. The entire pipeline — generation,
scoring, linting, scheduling, dispatch — runs end-to-end with **simulated** API calls,
so you can evaluate everything without spending a cent. Flip `DRY_RUN=false` and add
credentials to post for real:

| Platform | What real dispatch needs |
| :--- | :--- |
| **X / Twitter** | API v2 OAuth 1.0a user-context keys (Basic tier, $100/mo — the free tier cannot create tweets). Without them, the zero-cost **1-Click Native Intent** launcher in the web UI still works. |
| **Reddit** | A script app (client id/secret + username/password). Free and easy to create. |
| **LinkedIn** | A LinkedIn app with the `w_member_social` scope. OAuth 2.0 is handled server-side, so your client secret never touches the browser. |
| **Gemini (AI)** | Optional. Without it, PostForge uses its built-in algorithmic template engine. |

---

## Architecture

```
postforge/
├── shared/            @postforge/core — the brain (framework-agnostic TypeScript)
│   ├── algorithm/       heavyRanker · shadowbanLinter · optimalTimes · simClusterAligner
│   ├── ingestion/       githubIngestor · domCrawler (cheerio) · projectCrawler
│   └── generators/      promptTemplates · aiPrompts
├── server/            @postforge/api — Fastify + SQLite + scheduler
│   ├── providers/       x (API v2) · reddit (OAuth) · linkedin (OAuth 2.0 + ugcPosts)
│   ├── ai/              gemini client + the generate → score → iterate loop
│   ├── scheduler/       30s dispatch tick, retries with backoff, delayed replies
│   └── vault.ts         AES-256-GCM credential encryption at rest
├── mcp/               @postforge/mcp — Model Context Protocol server (stdio)
└── src/               the React 19 + Tailwind v4 web studio
```

The algorithm core is written once in `shared/` and imported by the web app, the API
server, and the MCP server — one source of truth, no logic duplication.

---

## Quickstart

```bash
git clone https://github.com/Aryanban/postforge.git
cd postforge
npm install          # installs all workspaces

# Terminal 1 — the backend (dispatch + scheduler + AI)
cp server/.env.example server/.env
npm -w @postforge/api run dev      # http://localhost:3001

# Terminal 2 — the web studio
npm run dev                        # http://localhost:5173
```

The web app detects the backend automatically and unlocks backend auto-dispatch,
AI generation, and OAuth-based LinkedIn connection. Without the backend running,
it stays fully usable in zero-cost native-intent mode.

Docker alternative:

```bash
docker compose up      # api on :3001, web on :4173
```

---

## Deployment & security

PostForge is a **single-user, localhost-first tool**. The API server has **no
authentication layer**, so it binds to `127.0.0.1` by default and refuses to
expose itself to your network:

- `HOST` is loopback-only unless you override it.
- `PUT /api/config/credentials` writes to the encrypted vault — anyone who can
  reach the port can overwrite or use your provider keys.
- The Docker Compose file sets `HOST=0.0.0.0` because a container *must* bind
  the wildcard address for the published port forward to work; the port is still
  only reachable from the Docker host. Do not replicate that override on a
  bare-metal or VPS deploy without putting an authenticating reverse proxy
  (Caddy, nginx + auth, Cloudflare Access, Tailscale Funnel…) in front of it.

**Secrets never live in the browser.** Provider keys entered in the web studio
are pushed to the server's AES-256-GCM vault and dropped from memory
immediately; localStorage retains only a "configured" boolean per provider, not
the credentials themselves. LinkedIn tokens are obtained server-side over OAuth
2.0, so the client secret never reaches the browser either.

---

## The Heavy Ranker Mathematics

PostForge scores posts using the real ranking multipliers from `twitter/the-algorithm`:

$$\text{Score} = 13.5 \times P(\text{Reply}) + 75.0 \times P(\text{Author Reply}) + 11.0 \times P(\text{Dwell} > 15s) + 1.0 \times P(\text{Retweet}) + 0.5 \times P(\text{Like}) - \text{Penalties}$$

- **The 150x Author-Reply Boost** — author responses carry 150x the weight of a like, so every generated post ends on a genuine question.
- **The Root Link Penalty (-50% to -70%)** — outbound URLs in the root tweet throttle distribution. PostForge quarantines the link into a **delayed first reply**, posted automatically 15 minutes after the root post.
- **Dwell Optimization** — bullets, line breaks, and short beats double screen pause time.
- **SimCluster Alignment** — computed, not hardcoded: the scorer measures how much of your project's ingested vocabulary each post actually covers.
- **Platform-Aware** — link penalties are calibrated per network (X throttles hard; Reddit self-posts and LinkedIn tolerate in-body links).

## The 7-Point Anti-Shadowban Shield

Every draft is linted before it can ship:

1. **Link Quarantine** — no external URLs in the root post.
2. **Hashtag Quarantine** — 0–1 hashtags; 2+ triggers spam de-ranking.
3. **Wall-of-Text Detector** — enforces dwell-friendly structure.
4. **Anti-Bot Interval Jitter** — randomized ±4–18 minute offsets on every schedule.
5. **Spam Word Filter** — flags "DM me", "check bio", and other high-risk phrases.
6. **Character Safety** — 280-char awareness and thread splitting.
7. **SimCluster Consistency** — warns when the copy drifts from your community's vocabulary.

`Auto-Fix` applies all of the above in one click: it rips URLs out of the root post,
formats the reply, and strips hashtag spam.

## AI Generation, Grounded by the Algorithm

The AI is never trusted blindly. Gemini drafts are scored by the **real** Heavy Ranker
and linter, and the model is re-prompted with specific feedback until the draft clears
80/100 with zero critical issues (max 3 rounds). The best-scoring draft always wins —
and you can watch every round's score in the UI.

Six frameworks: `morning-velocity`, `evening-debate`, `post-mortem`, `thread-hook`
(a real 5-part thread, each part ≤ 280 chars, posted as a reply chain),
`reddit-story` (9:1 compliant), and `launch-showcase`.

---

## REST API

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status, dry-run flag, configured providers |
| `POST` | `/api/projects/ingest` | Crawl a domain or GitHub repo into a profile |
| `GET` | `/api/projects` | List ingested projects |
| `POST` | `/api/posts/generate` | Template generation (no API key needed) |
| `POST` | `/api/posts/generate-ai` | Gemini generation with the scoring loop |
| `POST` `GET` `PUT` `DELETE` | `/api/posts` | Full post CRUD (PUT re-scores on edit) |
| `POST` | `/api/posts/:id/approve` | Approve for the scheduler |
| `POST` | `/api/posts/:id/dispatch` | Dispatch immediately |
| `GET` | `/api/dispatch/log` | Recent dispatch history |
| `GET` `PUT` | `/api/config/*` | Provider status + encrypted credential vault |
| `GET` | `/api/auth/linkedin` · `/callback` | LinkedIn OAuth 2.0 |

## MCP Server

Connect PostForge to Claude Desktop, Cursor, Zed, or any agentic IDE over stdio:

```jsonc
// Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "postforge": {
      "command": "node",
      "args": ["/path/to/postforge/mcp/dist/index.js"],
      "env": { "POSTFORGE_API_URL": "http://localhost:3001/api" }
    }
  }
}
```

Tools: `postforge_health`, `postforge_ingest`, `postforge_projects`,
`postforge_generate`, `postforge_generate_ai`, `postforge_score`, `postforge_lint`,
`postforge_schedule`, `postforge_queue`, `postforge_dispatch`,
`postforge_ai_frameworks`. Scoring and linting run locally against the shared core;
stateful operations proxy through the API.

---

## Feature Comparison

| Feature | PostForge | TweetHunter ($99/mo) | Typefully ($29/mo) | Postiz |
| :--- | :---: | :---: | :---: | :---: |
| Heavy Ranker algorithm scoring | ✅ Native, real math | ❌ | ❌ | ❌ |
| 7-point anti-shadowban linter | ✅ Built-in | ❌ | ❌ | ❌ |
| Delayed link-quarantine replies | ✅ Automated | ⚠️ Manual | ⚠️ Manual | ❌ |
| Live GitHub repo ingestion | ✅ Direct API | ❌ | ❌ | ❌ |
| Real DOM crawling of any domain | ✅ cheerio | ❌ | ❌ | ❌ |
| AI drafts scored in an iterate loop | ✅ | ❌ | ⚠️ | ⚠️ |
| LinkedIn dispatch (server-side OAuth) | ✅ | ❌ | ❌ | ❌ |
| MCP server for agentic IDEs | ✅ | ❌ | ❌ | ❌ |
| Zero-cost mode (no paid API) | ✅ 1-Click Intent | ❌ | ❌ | ⚠️ |
| Reddit 9:1 guardrail | ✅ | ❌ | ❌ | ❌ |
| License | MIT | Closed | Closed | AGPL-3.0 |

---

## Development

```bash
npm test                              # 37 vitest tests across the core + AI loop
npm run lint                          # typecheck web
npm -w @postforge/api run lint        # typecheck api
npm -w @postforge/mcp run lint        # typecheck mcp
npm run build                         # build web
npm -w @postforge/api run build       # build api
npm -w @postforge/mcp run build       # build mcp (bundled CLI)
```

All three workspaces are verified by the CI workflow on every push and pull request.

---

## Contributing

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/cool-algorithm-rule`).
3. Add tests under `shared/**/*.test.ts` or `server/src/**/*.test.ts`.
4. Open a Pull Request — CI runs typechecks, the full test suite, and all three builds.

If PostForge helped your project get traction, please **star the repo ⭐**!

---

## License

Open source under the **MIT License**. Created by [Aryan Bansal](https://github.com/Aryanban).
