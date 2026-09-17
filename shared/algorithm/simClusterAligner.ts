import type { ProjectProfile } from '../types';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'you', 'your', 'our', 'we',
  'is', 'are', 'to', 'of', 'in', 'on', 'it', 'this', 'that', 'by', 'from', 'at',
  'as', 'be', 'all', 'get', 'use', 'using', 'more', 'most', 'best', 'new', 'now',
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\- ]/g, ' ');
}

function tokenize(text: string, limit: number): string[] {
  const counts = new Map<string, number>();
  const words = normalize(text).match(/[a-z][a-z0-9+#.\-]{1,}/g) ?? [];
  for (const word of words) {
    if (word.length < 3 || STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Builds the target vocabulary for a project from everything we ingested:
 * tech stack, SimClusters, value props, description, and name.
 */
export function extractProjectKeywords(project: ProjectProfile, limit = 24): string[] {
  const corpus = [
    project.name,
    project.description,
    project.tagline,
    project.targetPersona,
    ...project.techStack,
    ...project.simClusters,
    ...project.valueProps,
  ].join('\n');
  const keywords = new Set<string>([...tokenize(corpus, limit)]);
  // Preserve meaningful multi-word cluster names as whole phrases too.
  project.simClusters.forEach(c => keywords.add(normalize(c)));
  project.techStack.forEach(t => keywords.add(normalize(t)));
  return [...keywords].filter(k => k.length > 2).slice(0, limit);
}

/**
 * Replaces the previous hardcoded constant. Measures how much of the
 * project's semantic territory the post actually covers: each target keyword
 * that appears in the copy raises coverage, mapping to a 35–100 band.
 */
export function calculateSimClusterAlignment(
  content: string,
  keywords?: string[]
): number {
  if (!keywords || keywords.length === 0) return 70;
  const text = normalize(content);
  const matched = keywords.filter(k => text.includes(k));
  const coverage = matched.length / keywords.length;
  return Math.round(35 + coverage * 65);
}
