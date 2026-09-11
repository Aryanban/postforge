# PostForge • Algorithm-Native Social & Anti-Shadowban Engine

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-lime.svg?style=for-the-badge" alt="License MIT" />
  <img src="https://img.shields.io/badge/Algorithm-X%20Heavy%20Ranker-black?style=for-the-badge&logo=x" alt="X Algorithm" />
  <img src="https://img.shields.io/badge/Stack-React%2019%20%7C%20TypeScript-indigo?style=for-the-badge" alt="React 19" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome" />
</p>

> **The first open-source, algorithm-aware growth engine for X and Reddit.**  
> Built by reverse-engineering `twitter/the-algorithm` and `xai-org/x-algorithm`, combining multi-network scheduling inspired by `gitroomhq/postiz-app`, and zero-touch project ingestion inspired by `unclecode/crawl4ai`.

---

## ⚡ Why PostForge Outperforms Traditional Tools

Existing tools (TweetHunter, Typefully, Buffer, Postiz) are **"dumb queues"** — they schedule whatever you write without understanding how modern recommendation neural networks score and throttle posts.

PostForge acts as a **Creator-Side Pre-Flight Linter** that evaluates your drafts against the mathematical parameters of the open-sourced Twitter Heavy Ranker **before you publish**:

```
[ User Inputs Domain or GitHub URL ]
                 │
                 ▼
     [ Live Project Ingestion ] (Crawl4AI & GitHub REST API)
   • Pulls stars, README, tech stack, and value propositions
   • Maps project into semantic SimCluster profiles
                 │
                 ▼
     [ Algorithmic Content Synthesizer ]
   ┌─────────────┴─────────────┐
   ▼                           ▼
[ Morning Velocity Post ]   [ Evening Discussion Post ]
• Hook-first breakdown       • 150x Author-Reply catalyst
• Dwell-time formatting      • Binary debate dilemma
   └─────────────┬─────────────┘
                 │
                 ▼
[ 7-Point Anti-Shadowban Linter ]
  ✓ Root Link Quarantine (Extracts URL -> Delayed 1st Reply)
  ✓ Hashtag Quarantine (Caps at 0–1 to prevent spam de-ranking)
  ✓ Wall-of-Text Detector (Optimizes visual reading pause)
  ✓ Anti-Bot Interval Jitter (±4 to 18 min randomized offsets)
  ✓ Reddit 9:1 Self-Promotion Compliance Check
                 │
                 ▼
[ Multi-Mode Dispatch & Scheduler ]
  ├── Mode A: 1-Click Native Intent Launcher (100% Free / Zero API cost)
  └── Mode B: Direct X API v2 & Reddit PRAW (Automated)
```

---

## 📊 Feature Comparison: PostForge vs Competitors

| Feature | PostForge (Open Source) | TweetHunter ($99/mo) | Typefully ($29/mo) | Postiz (Open Source) |
| :--- | :---: | :---: | :---: | :---: |
| **Heavy Ranker Algorithm Scoring** | ✅ **Native** | ❌ No | ❌ No | ❌ No |
| **7-Point Anti-Shadowban Linter** | ✅ **Built-in** | ❌ No | ❌ No | ❌ No |
| **2-Step Link Quarantine (URL in reply)** | ✅ **Automated** | ⚠️ Manual | ⚠️ Manual | ❌ No |
| **Live GitHub Repo Auto-Ingestion** | ✅ **Direct API** | ❌ No | ❌ No | ❌ No |
| **Zero-Cost Mode (No $100/mo X API needed)** | ✅ **1-Click Intent** | ❌ Requires sub | ❌ Requires sub | ⚠️ Complex setup |
| **Reddit 9:1 Self-Promo Guardrail** | ✅ **Included** | ❌ No | ❌ No | ❌ No |
| **Humanized Anti-Bot Jitter** | ✅ **Randomized** | ❌ Exact times | ❌ Exact times | ❌ Exact times |
| **100% Free & Self-Hostable** | ✅ **MIT License** | ❌ Closed Source | ❌ Closed Source | ⚠️ AGPL-3.0 |

---

## 🔬 The Heavy Ranker Mathematics

PostForge evaluates posts using the real ranking multipliers from `twitter/the-algorithm`:

$$\text{Score} = 13.5 \times P(\text{Reply}) + 75.0 \times P(\text{Author Reply}) + 11.0 \times P(\text{Dwell} > 15s) + 1.0 \times P(\text{Retweet}) + 0.5 \times P(\text{Like}) - \text{Penalties}$$

* **The 150× Author-Reply Boost**: Author responses to comments carry 150× the weight of a passive like. PostForge automatically frames posts with open-loop questions to stimulate conversation.
* **The Root Link Distribution Penalty (-50% to -70%)**: Outbound URLs in the main tweet trigger platform retention penalties. PostForge automatically decouples external links into a **delayed 1st reply**.
* **Dwell Time Optimization**: Bullet points, code snippets, and short lines double screen pause time, signaling high intent to the neural ranker.

---

## 🛡️ The 7-Point Anti-Shadowban Shield

Every draft is evaluated before dispatch:
1. **Link Quarantine**: Prevents external URLs in root posts from throttling distribution.
2. **Hashtag Quarantine**: Limits hashtags to 0–1 (2+ hashtags actively trigger spam de-ranking).
3. **Wall-of-Text Detector**: Ensures readability on mobile viewports.
4. **Anti-Bot Interval Jitter**: Adds randomized minute offsets to prevent robotic timing signatures.
5. **Spam Word Filter**: Flags high-risk marketing phrases ("DM me", "Check bio").
6. **SimCluster Consistency**: Aligns post vocabulary with your target developer/tech community graph.
7. **Reddit 9:1 Rule**: Ensures Reddit submissions are 90% engineering lesson and only 10% link drop.

---

## 🚀 Quickstart & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Aryanban/postforge.git
cd postforge

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build production bundle
npm run build
```

Open `http://localhost:5173` to launch the PostForge Dashboard.

---

## 🤝 Contributing & Community

Contributions are welcome! If you want to add new platform adapters, improve scoring formulas, or add hook frameworks:
1. Fork the repo (`https://github.com/Aryanban/postforge`).
2. Create your feature branch (`git checkout -b feature/cool-algorithm-rule`).
3. Commit your changes (`git commit -m 'feat: add Bluesky algorithm adapter'`).
4. Push to the branch (`git push origin feature/cool-algorithm-rule`).
5. Open a Pull Request.

If PostForge helped your project get traction, please **give the repo a star ⭐ on GitHub**!

---

## 📄 License

PostForge is open source under the **MIT License**. Created by [Aryan Bansal](https://github.com/Aryanban).
