import * as cheerio from 'cheerio';
import type { ProjectProfile } from '../types';

export interface CrawledDomain {
  url: string;
  domain: string;
  title: string;
  description: string;
  keywords: string[];
  ogSiteName?: string;
  headings: string[];
  paragraphs: string[];
  jsonLd: unknown[];
  techFingerprints: string[];
}

/** Signature table for detecting the stack a site is built with. */
const TECH_SIGNATURES: { pattern: RegExp; tech: string }[] = [
  { pattern: /next(?:\.js|js)?|__next|_next/i, tech: 'Next.js' },
  { pattern: /nuxt/i, tech: 'Nuxt' },
  { pattern: /react(?:\.|-)?|_react/i, tech: 'React' },
  { pattern: /vue(?:\.|-)?/i, tech: 'Vue' },
  { pattern: /svelte/i, tech: 'Svelte' },
  { pattern: /angular/i, tech: 'Angular' },
  { pattern: /astro/i, tech: 'Astro' },
  { pattern: /gatsby/i, tech: 'Gatsby' },
  { pattern: /tailwind/i, tech: 'Tailwind CSS' },
  { pattern: /bootstrap/i, tech: 'Bootstrap' },
  { pattern: /wordpress|wp-(?:content|includes)/i, tech: 'WordPress' },
  { pattern: /shopify/i, tech: 'Shopify' },
  { pattern: /webflow/i, tech: 'Webflow' },
  { pattern: /framer/i, tech: 'Framer' },
  { pattern: /cloudflare/i, tech: 'Cloudflare' },
  { pattern: /vercel/i, tech: 'Vercel' },
  { pattern: /netlify/i, tech: 'Netlify' },
  { pattern: /supabase/i, tech: 'Supabase' },
  { pattern: /firebase/i, tech: 'Firebase' },
];

function compact(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Fetches and parses a live website: meta/og tags, headings, body copy,
 * JSON-LD entities, and a Wappalyzer-style tech fingerprint.
 */
export async function crawlDomain(rawUrl: string): Promise<CrawledDomain> {
  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const parsed = new URL(url);
  const domain = parsed.hostname.replace(/^www\./, '');

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'PostForgeIngestor/2.0 (+https://github.com/Aryanban/postforge)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(15_000),
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`crawl failed for ${domain} (HTTP ${res.status})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const metaDescription = compact($('meta[name="description"]').attr('content') ?? '');
  const ogDescription = compact($('meta[property="og:description"]').attr('content') ?? '');
  const ogTitle = compact($('meta[property="og:title"]').attr('content') ?? '');
  const ogSiteName = compact($('meta[property="og:site_name"]').attr('content') ?? '') || undefined;
  const generator = compact($('meta[name="generator"]').attr('content') ?? '');
  const metaKeywords = compact($('meta[name="keywords"]').attr('content') ?? '');

  const headings: string[] = [];
  $('h1, h2').each((_, el) => {
    const text = compact($(el).text());
    if (text.length > 3 && text.length < 120) headings.push(text);
  });

  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = compact($(el).text());
    if (text.length > 20) paragraphs.push(text);
  });

  const jsonLd: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLd.push(JSON.parse($(el).contents().text() || '{}'));
    } catch {
      /* malformed JSON-LD is ignored */
    }
  });

  const haystack = `${html}\n${generator}`;
  const techFingerprints = Array.from(
    new Set(
      TECH_SIGNATURES.filter(sig => sig.pattern.test(haystack)).map(sig => sig.tech)
    )
  );

  return {
    url,
    domain,
    title: ogTitle || compact($('title').text()) || domain,
    description: metaDescription || ogDescription,
    keywords: metaKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 1)
      .slice(0, 12),
    ogSiteName,
    headings: headings.slice(0, 12),
    paragraphs: paragraphs.slice(0, 25),
    jsonLd,
    techFingerprints,
  };
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'you', 'your', 'our', 'we',
  'is', 'are', 'to', 'of', 'in', 'on', 'it', 'this', 'that', 'by', 'from', 'at',
  'as', 'be', 'all', 'get', 'use', 'using', 'more', 'most', 'best', 'new', 'now',
]);

/** Tokenizes text into normalized keyword candidates. */
function tokenize(text: string, limit: number): string[] {
  const counts = new Map<string, number>();
  const words = text.toLowerCase().match(/[a-z][a-z0-9+#.\-]{1,}/g) ?? [];
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
 * Synthesizes a ProjectProfile from a live crawl. Replaces the previous
 * hardcoded generic fallback with data actually read from the site.
 */
export function synthesizeProfileFromCrawl(crawl: CrawledDomain): ProjectProfile {
  const corpus = [
    crawl.title,
    crawl.description,
    crawl.headings.join(' '),
    crawl.paragraphs.slice(0, 12).join(' '),
    crawl.keywords.join(' '),
  ].join('\n');

  const topTerms = tokenize(corpus, 8);
  const techStack = crawl.techFingerprints.length
    ? crawl.techFingerprints
    : topTerms.slice(0, 4).map(t => t.replace(/^\w/, c => c.toUpperCase()));

  const valueProps = crawl.headings
    .slice(0, 3)
    .map(h => h.replace(/[.!]?$/, ''))
    .filter(h => h.length > 5);
  while (valueProps.length < 3) {
    valueProps.push(`Live platform at ${crawl.domain} serving its core audience`);
    break;
  }

  const clusterTerms = topTerms.slice(0, 3).map(t => t.replace(/^\w/, c => c.toUpperCase()));
  const simClusters = Array.from(
    new Set([...clusterTerms, 'Web Development', 'Tech Founders'].map(c => c.trim()))
  ).slice(0, 4);

  return {
    id: crawl.domain.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
    domain: crawl.domain,
    name: crawl.ogSiteName || crawl.title || crawl.domain,
    tagline: crawl.description || `Live web platform at ${crawl.domain}.`,
    description: crawl.paragraphs[0] || crawl.description || `Website crawled from ${crawl.domain}.`,
    techStack,
    targetPersona: 'Developers, early adopters, and modern tech teams',
    valueProps: valueProps.slice(0, 4),
    simClusters,
    recommendedSubreddits: ['r/SideProject', 'r/webdev', 'r/startups'],
    lastIngestedAt: new Date().toISOString(),
  };
}
