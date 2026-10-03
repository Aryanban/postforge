/**
 * Intelligent Multi-Post Thread Splitter for PostForge.
 * Rivals Typefully and Hypefury by splitting long-form thoughts, essays,
 * or announcements into perfectly formatted, numbered thread sequences.
 */

export interface ThreadSplitterOptions {
  maxChars?: number;       // Default 270 (leaves room for numbering)
  addNumbering?: boolean;  // Default true: (1/N), (2/N)
  includeOutroCta?: boolean;
  outroCtaText?: string;
  platform?: 'x' | 'bluesky';
}

/**
 * Splits arbitrary text into a threaded sequence of posts without cutting words or sentences.
 */
export function splitIntoThread(
  rawText: string,
  options: ThreadSplitterOptions = {}
): string[] {
  const {
    maxChars = options.platform === 'bluesky' ? 290 : 270,
    addNumbering = true,
    includeOutroCta = false,
    outroCtaText = 'If you found this breakdown insightful:\n\n1. Follow for more deep-dives\n2. Repost the first post to share with others 🔄',
  } = options;

  const text = rawText.trim();
  if (!text) return [];

  // If text already comfortably fits in a single post without outro, return as-is
  if (text.length <= (options.platform === 'bluesky' ? 300 : 280) && !includeOutroCta) {
    return [text];
  }

  // Split into logical blocks: paragraphs first
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      chunks.push(para);
    } else {
      // Split paragraph by sentences
      const sentences = para.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [para];
      let currentChunk = '';

      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;

        if (currentChunk.length + trimmed.length + 1 <= maxChars) {
          currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          // If a single sentence is longer than maxChars, split on words
          if (trimmed.length > maxChars) {
            const words = trimmed.split(/\s+/);
            let wordChunk = '';
            for (const word of words) {
              if (wordChunk.length + word.length + 1 <= maxChars) {
                wordChunk = wordChunk ? `${wordChunk} ${word}` : word;
              } else {
                if (wordChunk) chunks.push(wordChunk);
                wordChunk = word;
              }
            }
            if (wordChunk) currentChunk = wordChunk;
          } else {
            currentChunk = trimmed;
          }
        }
      }
      if (currentChunk) chunks.push(currentChunk);
    }
  }

  // Merge very small adjacent chunks where possible
  const mergedChunks: string[] = [];
  let buffer = '';

  for (const c of chunks) {
    if (!buffer) {
      buffer = c;
    } else if (buffer.length + c.length + 2 <= maxChars) {
      buffer = `${buffer}\n\n${c}`;
    } else {
      mergedChunks.push(buffer);
      buffer = c;
    }
  }
  if (buffer) mergedChunks.push(buffer);

  if (includeOutroCta && outroCtaText) {
    mergedChunks.push(outroCtaText.trim());
  }

  // If only 1 chunk was created, return without numbering
  if (mergedChunks.length <= 1) {
    return mergedChunks;
  }

  if (!addNumbering) {
    return mergedChunks;
  }

  // Append thread numbers: (1/N), (2/N)
  const total = mergedChunks.length;
  return mergedChunks.map((chunk, idx) => {
    const num = `(${idx + 1}/${total})`;
    // Check if adding numbering exceeds Twitter 280 / Bluesky 300 limit
    if (chunk.length + num.length + 1 <= (options.platform === 'bluesky' ? 300 : 280)) {
      return `${chunk}\n\n${num}`;
    }
    return `${chunk} ${num}`;
  });
}
