# PostForge • Algorithm-Native Social Growth Engine

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-lime.svg?style=for-the-badge" alt="License MIT" />
  <img src="https://img.shields.io/badge/Algorithm-X%20Heavy%20Ranker-black?style=for-the-badge&logo=x" alt="X Algorithm" />
  <img src="https://img.shields.io/badge/Tests-61%20Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests 61 Passing" />
  <img src="https://img.shields.io/badge/Stack-React%2019%20%7C%20Fastify%20%7C%20MCP-indigo?style=for-the-badge" alt="Stack" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome" />
</p>

> **The open-source, algorithm-aware growth engine rivaling TweetHunter, Typefully, and Taplio for X, LinkedIn, and Reddit.**
> A full-stack powerhouse: a React 19 studio, a Fastify dispatch + scheduling backend, a Model Context Protocol (MCP) server, and a shared TypeScript core that scores every draft against the real mathematics of `twitter/the-algorithm` before it ships.

---

## ⚡ What Makes PostForge Different

Most scheduling tools (Buffer, Hootsuite, Later) are **dumb queues** — they blindly publish whatever you write. Expensive creator tools (TweetHunter, Typefully, Taplio) charge up to $100/mo for simple schedulers.

**PostForge is a complete, 100% local creator cockpit and algorithm pre-flight engine:**

1. **Ingest** any website or GitHub repo (real DOM crawling with cheerio + GitHub API) to learn your product's voice and terminology.
2. **Typefully-Grade Thread Sequencer** — Splits long thoughts into engaging, chained multi-tweet threads with auto-numbering, hook preservation, and link quarantine.
3. **Taplio-Grade LinkedIn Carousel Studio** — Generates high-converting multi-slide 1080x1350 portrait carousel decks with 5 visual themes and instant SVG export.
4. **Generate & Score** with Gemini or built-in templates — scored in a recursive loop by the real X Heavy Ranker formulas until passing high-confidence thresholds.
5. **Lint** every draft against an automated 7-point anti-shadowban shield.
6. **Schedule** with humanized anti-bot jitter, and **dispatch for real** to X, Reddit, and LinkedIn — with automated first-reply link quarantine dodging the -50% root penalty.

---

## 🚀 Competitive Advantages vs. Paid Rivals

| Feature | PostForge | TweetHunter ($99/mo) | Typefully ($29/mo) | Taplio ($49/mo) |
| :--- | :---: | :---: | :---: | :---: |
| **Heavy Ranker Algorithm Scoring** | ✅ Native, real math | ❌ | ❌ | ❌ |
| **Typefully-Grade Thread Splitter** | ✅ Built-in (`shared/generators`) | ❌ | ✅ | ❌ |
| **Taplio-Grade LinkedIn Carousel Studio** | ✅ Built-in (1080x1350 SVG) | ❌ | ❌ | ✅ |
| **7-Point Anti-Shadowban Linter** | ✅ Automated | ❌ | ❌ | ❌ |
| **Delayed First-Reply Link Quarantine** | ✅ Automated (+15m) | ⚠️ Manual | ⚠️ Manual | ❌ |
| **Automated GitHub & Web Ingestion** | ✅ Cheerio & Octokit | ❌ | ❌ | ❌ |
| **Iterative AI Scoring Loop** | ✅ Gemini loop to 80+ score | ❌ | ⚠️ | ⚠️ |
| **LinkedIn Server-Side OAuth 2.0** | ✅ Encrypted vault | ❌ | ❌ | ✅ |
| **Closed-Loop Performance Tracking** | ✅ Actual vs. predicted | ⚠️ | ⚠️ | ⚠️ |
| **Model Context Protocol (MCP) Server** | ✅ 11 AI agent tools | ❌ | ❌ | ❌ |
| **Zero-Cost Local Mode** | ✅ 100% Local & Free | ❌ | ❌ | ❌ |
| **Price / Month** | **$0 (MIT License)** | **$99/mo** | **$29/mo** | **$49/mo** |

---

## ✨ Features Breakdown

### 🧵 Typefully-Grade Multi-Tweet Thread Splitter (`shared/generators/threadSplitter.ts`)
- **Intelligent Thought Splitting** — Breaks articles or long essays into coherent, high-velocity tweets respecting sentence boundaries.
- **Hook Optimization** — Inspects and enforces high-engagement curiosity/benefit hooks on Tweet 1.
- **Auto-Numbering & Chaining** — Adds clean `1/N` or `(1/N)` numbering and formats replies so they publish as a contiguous thread.
- **Quarantined CTA Tweet** — Moves project links to the final thread card to maximize top-of-funnel reach.

### 🎨 Taplio-Grade LinkedIn Carousel Deck Generator (`shared/generators/carouselGenerator.ts`)
- **Multi-Slide Carousel Builder** — Transforms complex topics, tutorials, or changelogs into swipeable 5–10 slide visual decks.
- **Mobile-First Portrait Aspect Ratio** — Built in 1080x1350 (4:5 portrait ratio) for maximum screen presence on the LinkedIn mobile feed.
- **5 Professional Color Themes** — Modern Dark, Minimalist Light, Indigo Tech, Crimson Punch, and Forest Green.
- **Vector SVG Engine** — Formats typography, slide numbers, brand badges, and handles client-side SVG exports ready for PDF conversion.

### 📐 The Heavy Ranker Mathematics
PostForge scores posts using the real ranking multipliers decoded from `twitter/the-algorithm`:

$$\text{Score} = 13.5 \times P(\text{Reply}) + 75.0 \times P(\text{Author Reply}) + 11.0 \times P(\text{Dwell} > 15\text{s}) + 1.0 \times P(\text{Retweet}) + 0.5 \times P(\text{Like}) - \text{Penalties}$$

- **150x Author-Reply Boost** — Author responses carry 150x the weight of a like; generator ensures posts invite genuine discourse.
- **Root Link Quarantine** — Outbound URLs in root tweets incur severe distribution penalties. PostForge automatically isolates the link into a delayed first reply posted 15 minutes later.
- **Dwell Time Optimization** — Formats copy with readable beats, bullet breaks, and spacing to increase screen dwell time.

### 🛡️ 7-Point Anti-Shadowban Shield
- **Link Quarantine** — Detects and strips external links in root posts.
- **Hashtag Quarantine** — Limits hashtags to 0–1; flags 2+ as engagement spam.
- **Wall-of-Text Detector** — Prevents reader fatigue by enforcing line break pacing.
- **Anti-Bot Interval Jitter** — Adds randomized ±4–18 minute offsets to scheduled times.
- **Spam Word Filter** — Catches shadowban trigger phrases like "DM me", "check bio", etc.
- **Character Safety** — Exact character tracking with thread splitting.
- **SimCluster Alignment** — Ensures draft vocabulary aligns with your project's domain keywords.

---

## 🚀 Quickstart

```bash
git clone https://github.com/Aryanban/postforge.git
cd postforge
npm install          # installs all workspaces

# Terminal 1 — Backend (Fastify + SQLite + Scheduler)
cp server/.env.example server/.env
npm -w @postforge/api run dev      # http://localhost:3001

# Terminal 2 — React 19 Web Studio
npm run dev                        # http://localhost:5173
```

Docker Compose alternative:

```bash
docker compose up                  # api on :3001, web on :4173
```

---

## 🔐 Credentials & Security

PostForge operates in **dry-run mode by default**. You can test the complete pipeline — crawling, generating, scoring, linting, scheduling, thread splitting, and carousel generation — completely free without connecting credentials.

When ready to post live:
- **X / Twitter**: API v2 OAuth 1.0a credentials (or use the zero-cost **1-Click Native Intent** button in the web UI).
- **Reddit**: Script App client ID & secret.
- **LinkedIn**: LinkedIn App with `w_member_social` scope via server-side OAuth 2.0.
- **Encrypted Vault**: Credentials entered in the UI are encrypted at rest using **AES-256-GCM** in SQLite and never stored in plain text or exposed to client-side localStorage.

---

## 🔌 Model Context Protocol (MCP) Server

PostForge includes an 11-tool MCP server for AI coding assistants (Claude Desktop, Cursor, Antigravity, Zed):

```json
{
  "mcpServers": {
    "postforge": {
      "command": "node",
      "args": ["/absolute/path/to/postforge/mcp/dist/index.js"],
      "env": { "POSTFORGE_API_URL": "http://localhost:3001/api" }
    }
  }
}
```

### Available MCP Tools:
- `postforge_health` — Check backend and provider connection status.
- `postforge_ingest` — Ingest web domain or GitHub repository into a profile.
- `postforge_projects` — List ingested projects and learned vocabulary.
- `postforge_generate` — Generate template-based posts without API keys.
- `postforge_generate_ai` — Run Gemini generator with iterative Heavy Ranker scoring loop.
- `postforge_score` — Calculate Heavy Ranker score and engagement probabilities.
- `postforge_lint` — Run 7-point anti-shadowban audit on any post draft.
- `postforge_schedule` — Add post with anti-bot jitter to the dispatch queue.
- `postforge_queue` — Inspect scheduled queue and delay timers.
- `postforge_dispatch` — Manually dispatch post immediately.
- `postforge_ai_frameworks` — List available proven viral post frameworks.

---

## 🧪 Testing & Quality Assurance

PostForge includes **61 Vitest unit and integration tests** verifying the algorithm engine, thread splitter, carousel generator, shadowban linter, optimal posting times, and SQLite queue persistence:

```bash
# Run all 61 automated tests
npm test

# Typecheck web studio and packages
npm run lint
npm -w @postforge/api run lint
npm -w @postforge/mcp run lint

# Production build
npm run build
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

<p align="center">
  <sub>Engineered with precision by <b>Aryan Bansal</b> • <a href="https://github.com/Aryanban">github.com/Aryanban</a></sub>
</p>
