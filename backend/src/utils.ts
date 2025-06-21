export function extractLargestJsonBlock(content: string): string | null {
  const candidates: string[] = [];

  // Match triple backtick-enclosed JSON blocks first
  const codeBlocks = [...content.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)];
  for (const match of codeBlocks) {
    candidates.push(match[1].trim());
  }

  // Scan text for JSON-like sections using bracket counting
  for (let i = 0; i < content.length; i++) {
    const startChar = content[i];
    if (startChar !== '{' && startChar !== '[') continue;
    const endChar = startChar === '{' ? '}' : ']';
    let depth = 0;
    for (let j = i; j < content.length; j++) {
      const ch = content[j];
      if (ch === startChar) depth++;
      if (ch === endChar) {
        depth--;
        if (depth === 0) {
          const candidate = content.slice(i, j + 1).trim();
          candidates.push(candidate);
          break;
        }
      }
    }
  }

  // Try to parse all candidates and return the largest valid one
  let best: string | null = null;
  let bestSize = 0;

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const size = JSON.stringify(parsed).length;
      if (size > bestSize) {
        best = candidate;
        bestSize = size;
      }
    } catch {
      // ignore invalid candidates
    }
  }

  return best;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
