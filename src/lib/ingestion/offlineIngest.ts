import { fetchLiveGitHubRepo, type ProjectProfile } from '@postforge/core';

export interface OfflineIngestResult {
  profile: ProjectProfile;
  /** True when the result is real fetched data; false when it is a heuristic guess. */
  live: boolean;
  /** Human-readable caveat to show in the crawl log (empty when fully live). */
  caveat: string;
}

/**
 * Browser-safe ingestion for when the backend is offline.
 *
 * Deliberately does NOT import the DOM crawler: cheerio is a heavy server-side
 * dependency, and cross-origin fetches of arbitrary domains are CORS-blocked in
 * the browser anyway. So we only attempt the paths that genuinely work
 * client-side (the CORS-open GitHub REST API), and are honest about the rest.
 */
export async function ingestOffline(inputUrl: string): Promise<OfflineIngestResult> {
  const cleanUrl = inputUrl.trim();
  let domain = cleanUrl;
  try {
    domain = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`).hostname.replace(
      /^www\./,
      ''
    );
  } catch {
    /* keep raw */
  }

  if (domain.includes('github.com')) {
    const profile = await fetchLiveGitHubRepo(cleanUrl);
    return { profile, live: true, caveat: '' };
  }

  return {
    profile: heuristicProfile(domain),
    live: false,
    caveat: `browser CORS blocks DOM crawling of ${domain} — start the backend for real page data. Showing a heuristic profile now.`,
  };
}

/**
 * Honest last resort with no dependencies: derives a generic profile from the
 * domain itself. Makes the degradation explicit rather than fabricating detail.
 */
function heuristicProfile(domain: string): ProjectProfile {
  const name = domain.replace(/^www\./, '').split('.')[0] || 'project';
  return {
    id: domain.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
    domain,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    tagline: `Heuristic profile for ${domain} (live crawl unavailable offline).`,
    description: `Placeholder profile synthesized from the domain name. Run ingestion with the PostForge backend running to extract the real tech stack, value props, and community clusters from the live site.`,
    techStack: ['React', 'TypeScript', 'Node.js'],
    targetPersona: 'Developers, Founders, and Early Adopters',
    valueProps: [
      'Value props unavailable offline — ingest with the backend running',
      'Heuristic profile generated from the domain name only',
    ],
    simClusters: ['Web Development', 'Tech Founders'],
    recommendedSubreddits: ['r/SideProject', 'r/webdev'],
    lastIngestedAt: new Date().toISOString(),
  };
}
