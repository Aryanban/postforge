/**
 * LinkedIn Carousel Slide Deck Generator for PostForge.
 * Rivals paid Taplio ($49-$149/mo) by converting posts, outlines, or bullet lists
 * into high-engagement, slide-by-slide visual document carousels.
 */

export interface CarouselSlide {
  slideNumber: number;
  totalSlides: number;
  title: string;
  subtitle?: string;
  bulletPoints?: string[];
  takeaway?: string;
  isCover?: boolean;
  isCta?: boolean;
}

export interface CarouselOptions {
  title?: string;
  subtitle?: string;
  authorName?: string;
  authorHandle?: string;
  domain?: string;
}

/**
 * Parses post content or notes into a structured multi-slide LinkedIn carousel deck.
 */
export function generateCarouselDeck(
  rawText: string,
  options: CarouselOptions = {}
): CarouselSlide[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const slides: CarouselSlide[] = [];

  // Determine main title
  const mainTitle = options.title || lines[0]?.replace(/^[#•\-\d.]+\s*/, '') || 'Engineering Breakdown';
  const remainingLines = lines.slice(options.title ? 0 : 1);

  // Group lines into content chunks (2-4 points per slide)
  const chunks: Array<{ title: string; points: string[]; takeaway?: string }> = [];
  let currentGroup: string[] = [];
  let currentHeading = '';

  for (const line of remainingLines) {
    if (line.endsWith(':') || line.startsWith('#') || line.match(/^[0-9]+\.\s+[A-Z]/)) {
      if (currentGroup.length > 0) {
        chunks.push({
          title: currentHeading || `Point ${chunks.length + 1}`,
          points: currentGroup,
        });
        currentGroup = [];
      }
      currentHeading = line.replace(/^[#0-9.:\s]+/, '').replace(/:$/, '').trim();
    } else {
      const cleanPoint = line.replace(/^[•\-\*]\s*/, '').trim();
      if (cleanPoint) currentGroup.push(cleanPoint);
    }
  }

  if (currentGroup.length > 0) {
    chunks.push({
      title: currentHeading || `Point ${chunks.length + 1}`,
      points: currentGroup,
    });
  }

  // If no structured chunks formed, split by paragraphs of 2-3 items
  if (chunks.length === 0) {
    chunks.push({
      title: 'Key Architecture Pillars',
      points: remainingLines.slice(0, 4),
    });
    if (remainingLines.length > 4) {
      chunks.push({
        title: 'Core Implementation Rules',
        points: remainingLines.slice(4, 8),
      });
    }
  }

  // Total slides = Cover (1) + Content Slides (N) + Outro CTA (1)
  const totalSlides = chunks.length + 2;

  // 1. Cover Slide
  slides.push({
    slideNumber: 1,
    totalSlides,
    title: mainTitle,
    subtitle: options.subtitle || 'A practical blueprint for builders & engineers.',
    isCover: true,
  });

  // 2. Content Slides
  chunks.forEach((chunk, idx) => {
    slides.push({
      slideNumber: idx + 2,
      totalSlides,
      title: chunk.title,
      bulletPoints: chunk.points.slice(0, 4),
      takeaway: chunk.points[chunk.points.length - 1],
    });
  });

  // 3. Outro CTA Slide
  slides.push({
    slideNumber: totalSlides,
    totalSlides,
    title: 'Found this valuable?',
    subtitle: 'Repost 🔄 to help another developer in your network.',
    bulletPoints: [
      `Follow ${options.authorName || 'for more engineering breakdowns'}`,
      'Save this carousel document for later reference 🔖',
      options.domain ? `Explore live systems: ${options.domain}` : 'Drop your thoughts in the comments 👇',
    ],
    isCta: true,
  });

  return slides;
}

/**
 * Generates clean, crisp 1080x1350 (4:5 portrait) SVG markup for any slide.
 */
export function generateSvgSlide(
  slide: CarouselSlide,
  options: {
    authorName?: string;
    authorHandle?: string;
    brandColor?: string;
  } = {}
): string {
  const author = options.authorName || 'Aryan Bansal';
  const handle = options.authorHandle || '@Aryanban';
  const accent = options.brandColor || '#6366f1'; // indigo-500

  const escapeXml = (unsafe: string) =>
    unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const titleEsc = escapeXml(slide.title);
  const subtitleEsc = slide.subtitle ? escapeXml(slide.subtitle) : '';

  let bodyContentSvg = '';

  if (slide.isCover) {
    bodyContentSvg = `
      <rect x="80" y="380" width="120" height="6" fill="${accent}" rx="3" />
      <text x="80" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="900" fill="#ffffff">
        ${titleEsc}
      </text>
      ${
        subtitleEsc
          ? `<text x="80" y="600" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="400" fill="#a1a1aa">
              ${subtitleEsc}
            </text>`
          : ''
      }
      <g transform="translate(80, 850)">
        <rect width="280" height="60" rx="30" fill="${accent}20" stroke="${accent}" stroke-width="2" />
        <text x="140" y="38" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="${accent}">
          SWIPE NEXT →
        </text>
      </g>
    `;
  } else {
    const points = (slide.bulletPoints || []).map((pt, i) => {
      const y = 460 + i * 140;
      const ptEsc = escapeXml(pt);
      return `
        <g transform="translate(80, ${y})">
          <circle cx="20" cy="20" r="16" fill="${accent}25" />
          <text x="20" y="27" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="800" fill="${accent}">${i + 1}</text>
          <text x="60" y="28" font-family="system-ui, sans-serif" font-size="28" font-weight="500" fill="#e4e4e7">${ptEsc}</text>
        </g>
      `;
    }).join('\n');

    bodyContentSvg = `
      <text x="80" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#ffffff">
        ${titleEsc}
      </text>
      <rect x="80" y="390" width="80" height="4" fill="${accent}" rx="2" />
      ${points}
    `;
  }

  return `
<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1080" height="1350" fill="#09090b" />
  <circle cx="950" cy="150" r="400" fill="${accent}10" filter="blur(80px)" />
  <circle cx="100" cy="1200" r="300" fill="${accent}08" filter="blur(60px)" />

  <!-- Header -->
  <g transform="translate(80, 80)">
    <circle cx="30" cy="30" r="26" fill="#18181b" stroke="#27272a" stroke-width="2" />
    <text x="30" y="38" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="800" fill="${accent}">
      ${escapeXml(author.slice(0, 2).toUpperCase())}
    </text>
    <text x="75" y="26" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#ffffff">${escapeXml(author)}</text>
    <text x="75" y="50" font-family="system-ui, sans-serif" font-size="18" font-weight="500" fill="#71717a">${escapeXml(handle)}</text>
    
    <!-- Slide Counter -->
    <rect x="800" y="8" width="120" height="42" rx="21" fill="#18181b" stroke="#27272a" stroke-width="1.5" />
    <text x="860" y="36" text-anchor="middle" font-family="system-ui, monospace" font-size="18" font-weight="700" fill="#d4d4d8">
      ${slide.slideNumber} / ${slide.totalSlides}
    </text>
  </g>

  <!-- Body Content -->
  ${bodyContentSvg}

  <!-- Footer Branding -->
  <g transform="translate(80, 1260)">
    <line x1="0" y1="0" x2="920" y2="0" stroke="#27272a" stroke-width="1" />
    <text x="0" y="40" font-family="system-ui, monospace" font-size="18" font-weight="600" fill="#52525b">POSTFORGE • ZERO-KEY OPEN SOURCE</text>
    <text x="920" y="40" text-anchor="end" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="${accent}">LINKEDIN DOCUMENT CAROUSEL</text>
  </g>
</svg>
`.trim();
}
