import type { PlatformType, ProjectProfile } from '../types';

/** A draft as produced by the model, before algorithmic scoring. */
export interface AIDraft {
  hook: string;
  mainContent: string;
  replyContent?: string;
  threadParts?: string[];
  whyAlgorithmLikes: string;
}

export interface AIFramework {
  id: string;
  name: string;
  platforms: PlatformType[];
  brief: string;
}

export const AI_FRAMEWORKS: AIFramework[] = [
  {
    id: 'morning-velocity',
    name: 'Morning Velocity Breakdown',
    platforms: ['x', 'linkedin'],
    brief: 'A hook-first technical breakdown engineered for morning bookmark/retweet velocity. Bulleted, dwell-dense, ends with a question.',
  },
  {
    id: 'evening-debate',
    name: 'Evening Discussion Catalyst',
    platforms: ['x', 'linkedin'],
    brief: 'A binary "would you rather" dilemma that splits the audience into camps and forces replies during peak mobile hours.',
  },
  {
    id: 'post-mortem',
    name: 'Engineering Post-Mortem',
    platforms: ['x', 'linkedin', 'reddit'],
    brief: 'Vulnerable, specific failure story (3 concrete mistakes + fixes). Vulnerability triples comment rates vs launch bragging.',
  },
  {
    id: 'thread-hook',
    name: '5-Part Architecture Thread',
    platforms: ['x'],
    brief: 'A multi-part thread. Produce threadParts as an array of 5 tweet bodies, each under 280 characters, first one being the hook.',
  },
  {
    id: 'reddit-story',
    name: 'Reddit 9:1 Value Showcase',
    platforms: ['reddit'],
    brief: '90% engineering lesson, 10% open-source link drop. Must read as community value, never as marketing copy.',
  },
  {
    id: 'launch-showcase',
    name: 'Build-in-Public Launch',
    platforms: ['x', 'linkedin'],
    brief: 'Authentic build-in-public milestone with concrete numbers and a lesson, asking for honest feedback.',
  },
];

export function frameworkById(id: string): AIFramework | undefined {
  return AI_FRAMEWORKS.find(f => f.id === id);
}

const PLATFORM_VOICE: Record<PlatformType, string> = {
  x: 'X/Twitter: punchy, under 280 characters per post, short lines, one hashtag maximum, no links in the root post.',
  reddit:
    'Reddit: plain markdown, authentic community voice, prefix the title with [Showcase] or [Project], no marketing superlatives, no asking for upvotes.',
  linkedin:
    'LinkedIn: professional but human, slightly longer form is fine, no hashtags spam, lead with the insight.',
};

export function buildSystemPrompt(platform: PlatformType): string {
  return `You are the PostForge algorithmic content engine. You write social posts that are explicitly engineered against the X Heavy Ranker recommendation model and platform anti-spam heuristics.

Non-negotiable rules you must obey in every draft:
1. NEVER place an outbound URL in the root post — it triggers a -50% to -70% distribution penalty. Put links in the delayed first reply (replyContent) instead.
2. Use at most ONE hashtag. Two or more hashtags trigger spam de-ranking.
3. End with a specific, genuine question that invites disagreement or story-sharing — author replies carry 150x the weight of a like, so conversational hooks are the single biggest lever.
4. Optimize dwell time: break the body into short lines, bullets, or numbered beats. Never publish a wall of text.
5. Concrete numbers and honest vulnerability beat self-congratulation and adjectives.
6. Never use high-risk spam phrases ("DM me", "check bio", "buy now", "limited spots").

Platform voice — ${PLATFORM_VOICE[platform]}

Return ONLY valid JSON with exactly these fields:
{
  "hook": string,            // the opening line, must stop a scroll
  "mainContent": string,     // the full root post body (no URLs)
  "replyContent": string,    // the delayed first reply carrying any link
  "threadParts": string[],   // ONLY for thread frameworks: 5 bodies, each <= 280 chars, no URLs in part 1
  "whyAlgorithmLikes": string// one sentence on why the Heavy Ranker rewards this structure
}`;
}

export function buildUserPrompt(
  project: ProjectProfile,
  frameworkId: string,
  platform: PlatformType,
  feedback?: string
): string {
  const framework = frameworkById(frameworkId);
  return `Write a ${framework?.name ?? frameworkId} post for ${platform}.

PROJECT CONTEXT
name: ${project.name}
domain: ${project.domain}
tagline: ${project.tagline}
description: ${project.description}
tech stack: ${project.techStack.join(', ')}
value props:
${project.valueProps.map(v => `- ${v}`).join('\n')}
target persona: ${project.targetPersona}
${project.recommendedSubreddits.length ? `target communities: ${project.recommendedSubreddits.join(', ')}` : ''}

FRAMEWORK BRIEF
${framework?.brief ?? ''}

${
  feedback
    ? `PREVIOUS ATTEMPT FEEDBACK (the last draft was rejected by the scoring engine — fix these specific weaknesses and rewrite):\n${feedback}`
    : ''
}

Remember: no URLs in the root post, at most one hashtag, end on a real question. Return JSON only.`;
}
