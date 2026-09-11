# PostForge • Algorithm-Native Social & Anti-Shadowban Engine

> **The first open-source, algorithm-aware social management engine.**  
> Built by reverse-engineering `twitter/the-algorithm` and `xai-org/x-algorithm`, combining multi-platform scheduling inspired by `gitroomhq/postiz-app`, and zero-touch project ingestion inspired by `unclecode/crawl4ai`.

---

## ⚡ What We Improved Upon Existing Open-Source Repositories

| Upstream Project | What It Did | What PostForge Improves & Adds |
| :--- | :--- | :--- |
| **`twitter/the-algorithm`** | The raw Scala/Rust recommendation model that scores tweets inside X's data centers. | **We inverted it into a Creator-Side Pre-Flight Linter.** Instead of wondering why a post flopped, PostForge scores your draft in real-time (0–100) using the Heavy Ranker formulas before you publish. |
| **`gitroomhq/postiz-app`** (30k+ ⭐) | A scheduling dashboard for 30+ networks, but operates like a dumb queue (it schedules whatever you write). | **We added the missing "Algorithmic Brain"**: automated domain/repo ingestion, 2-step link quarantine (hook in tweet, URL in 1st reply), and humanized jitter scheduling ($\pm 4\text{ to }18\text{ mins}$) to bypass bot detection. |
| **`unclecode/crawl4ai`** | Extracts raw markdown from web pages. | **We pipe scraped project data into a Viral Positioning Synthesizer**: automatically generates Contrarian Engineering Hooks, 5-Tweet Architecture Breakdowns, and Reddit 9:1 compliant stories. |

---

## 🔬 The Core Algorithmic Mathematics (X Heavy Ranker)

PostForge evaluates draft posts against the actual parameters found in X's recommendation engine:

* **Author-to-Reply Interaction (150× multiplier)**: When the author replies to a commenter in their thread, it generates the highest session retention score. PostForge automatically structures posts with binary dilemma questions to trigger active debates.
* **The Root Link Distribution Penalty (-50% to -70%)**: X's algorithm heavily de-ranks posts containing external links in the root tweet to prevent users from leaving the platform.
  * **PostForge Solution**: **2-Step Link Quarantine**. PostForge extracts your URL and queues it as an automated 1st reply 15 minutes after the tweet launches.
* **Hashtag De-Ranking**: Using 2 or more hashtags triggers modern spam classifier de-ranking. PostForge caps hashtags at 0–1.
* **Dwell Time Index (>10s–15s)**: Linebreaks, bullet points, and code snippet formatting naturally double the visual dwell time on mobile screens.

---

## 🛡️ The 7-Point Anti-Shadowban Guardrail

Every post passes through an automated pre-flight security scan:
1. **Root Link Quarantine**: Detects external URLs and offers 1-click detachment to the 1st reply.
2. **Hashtag Quarantine**: Eliminates hashtag spam traps.
3. **Wall-of-Text Detector**: Formats dense paragraphs into high dwell-time bullet hierarchies.
4. **Anti-Bot Interval Jitter**: Injects pseudo-random offsets ($\pm 4\text{ to }18\text{ mins}$) so posting timestamps never match robotic intervals.
5. **Commercial Keyword Filter**: Flags over-aggressive marketing triggers ("DM me", "Check bio", "Limited spots").
6. **SimCluster Semantic Alignment**: Ensures terminology matches developer, AI, and systems engineering clusters.
7. **Reddit 9:1 Self-Promotion Ratio**: Guarantees Reddit posts are 90% engineering lesson and only 10% link drop to comply with community AutoMod rules.

---

## 🚀 Two Operating Modes

1. **Zero-Cost 1-Click Native Intent Launcher (100% Free)**:
   * X API Basic costs $100/month. PostForge offers a native 1-click launcher (`twitter.com/intent/tweet?text=...`) that automatically opens pre-formatted, algorithm-cleansed posts directly in X without needing any paid developer account!
2. **Automated API Dispatch Mode**:
   * Connect your X API v2 keys and Reddit PRAW credentials in the client-side encrypted Local Vault for hands-off automated publishing.

---

## 🛠️ Quickstart & Local Setup

```bash
# Clone the repository
git clone https://github.com/Aryanban/busy-heisenberg.git
cd busy-heisenberg

# Install dependencies
npm install

# Start the local development server
npm run dev

# Build production bundle
npm run build
```

Open `http://localhost:5173` to launch the PostForge Dashboard.

---

## 📦 Tech Stack

* **Framework**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS v4 + Dark Brutalist Theme
* **Icons**: Lucide React
* **Storage**: Client-Side Encrypted Local Vault (Zero third-party data tracking)
* **License**: MIT (Open Source)
