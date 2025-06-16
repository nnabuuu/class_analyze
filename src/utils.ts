export function extractLargestJsonBlock(content: string): string | null {
  const candidates: string[] = [];

  // Match triple backtick-enclosed JSON blocks
  const codeBlocks = [...content.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)];
  for (const match of codeBlocks) {
    candidates.push(match[1].trim());
  }

  // Match anything that looks like an object or array
  const genericBlocks = [...content.matchAll(/(\{[\s\S]+?\})/g)];
  for (const match of genericBlocks) {
    candidates.push(match[1].trim());
  }
  const arrayBlocks = [...content.matchAll(/(\[[\s\S]+?\])/g)];
  for (const match of arrayBlocks) {
    candidates.push(match[1].trim());
  }

  // Try to parse all and return the largest valid one
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
      continue;
    }
  }

  return best;
}
