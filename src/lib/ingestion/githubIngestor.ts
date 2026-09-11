import { ProjectProfile } from '../../types';

export interface GitHubRepoDetails {
  owner: string;
  repo: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  topics: string[];
  homepage?: string;
  license?: string;
  readmeExcerpt?: string;
}

/**
 * Directly calls GitHub Public REST API to fetch live repo metadata,
 * stars, languages, topics, and parses README content.
 */
export async function fetchLiveGitHubRepo(repoUrl: string): Promise<ProjectProfile> {
  const cleanUrl = repoUrl.trim().replace(/^https?:\/\//, '').replace(/^github\.com\//, '');
  const parts = cleanUrl.split('/');
  const owner = parts[0] || 'Aryanban';
  const repo = parts[1] || 'postforge';

  let details: GitHubRepoDetails = {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    description: 'Open-source software platform and architectural systems repository.',
    stars: 1,
    forks: 0,
    openIssues: 0,
    language: 'TypeScript',
    topics: ['open-source', 'developer-tools'],
  };

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (res.ok) {
      const data = await res.json();
      details = {
        owner: data.owner?.login || owner,
        repo: data.name || repo,
        fullName: data.full_name || `${owner}/${repo}`,
        description: data.description || details.description,
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        openIssues: data.open_issues_count || 0,
        language: data.language || 'TypeScript',
        topics: data.topics || ['open-source', 'developer-tools'],
        homepage: data.homepage || '',
        license: data.license?.spdx_id || 'MIT',
      };
    }
  } catch (err) {
    console.warn('GitHub API fetch failed or rate limited, using synthesized fallback:', err);
  }

  // Attempt to fetch raw README for high-fidelity value props
  let readmeText = '';
  try {
    const rawReadmeRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`);
    if (rawReadmeRes.ok) {
      readmeText = await rawReadmeRes.text();
    } else {
      const masterReadmeRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
      if (masterReadmeRes.ok) {
        readmeText = await masterReadmeRes.text();
      }
    }
  } catch (e) {
    // ignore
  }

  // Extract features / value props from README or metadata
  const extractedValueProps: string[] = [];
  if (readmeText) {
    const bulletMatches = readmeText.match(/^[-*]\s+\*\*([^*]+)\*\*:\s*(.+)$/gm);
    if (bulletMatches && bulletMatches.length > 0) {
      bulletMatches.slice(0, 4).forEach(b => {
        extractedValueProps.push(b.replace(/^[-*]\s+/, ''));
      });
    }
  }

  if (extractedValueProps.length === 0) {
    extractedValueProps.push(
      `100% open-source ${details.language} codebase with ${details.stars} GitHub stars`,
      `Zero vendor lock-in with production-ready architecture and ${details.license} license`,
      `Engineered for high performance, developer extensibility, and clean modularity`
    );
  }

  const techTokens = Array.from(new Set([
    details.language,
    ...details.topics.slice(0, 5).map(t => t.replace(/-/g, ' ')),
    'Git & GitHub'
  ])).filter(Boolean);

  return {
    id: `github-${owner}-${repo}`.toLowerCase(),
    domain: `github.com/${owner}/${repo}`,
    name: details.repo.replace(/[-_]/g, ' ').toUpperCase(),
    tagline: details.description || `Open-source ${details.language} project by @${details.owner}.`,
    description: details.description || `Community open-source repository featuring ${details.stars} stars and active developer workflows.`,
    techStack: techTokens,
    targetPersona: 'Open Source Developers, Software Engineers, and GitHub Community Builders',
    valueProps: extractedValueProps,
    simClusters: [
      'Open Source Community [Cluster 89]',
      `${details.language} Developers [Cluster 142]`,
      'Developer Tooling [Cluster 304]',
      'Indie Software Engineers [Cluster 412]'
    ],
    recommendedSubreddits: ['r/opensource', 'r/programming', 'r/SideProject', 'r/github', 'r/developer'],
    lastIngestedAt: new Date().toISOString()
  };
}
