
import { Candidate } from '../types';
import { POI_SUFFIXES } from '../constants';

const hasPoiSuffix = (text: string) => {
  const words = text.split(/\s+/);
  const lastWord = words[words.length - 1];
  return POI_SUFFIXES.some(suffix => lastWord.toLowerCase() === suffix.toLowerCase());
};

const isCapitalizedPhrase = (text: string) => {
    return /^[A-Z][a-z']*\s*([A-Z][a-z']*\s*)*$/.test(text);
};


export function extractCandidates(rawText: string): Candidate[] {
  const lines = rawText
    .split(/[\n;•–—]/)
    .map(line => {
        // Strip emojis and non-standard characters first
        return line.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|<<|>>|😅)/g, '').trim();
    })
    .filter(line => line.length > 0);

  const candidates: Candidate[] = [];
  let position = 0;

  for (const line of lines) {
    let main_name = line;
    let hint_city: string | undefined = undefined;

    // Split on commas only if it looks like a location qualifier
    if (line.includes(',')) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length === 2 && parts[1].length > 0 && parts[1].length < 20) {
        main_name = parts[0];
        hint_city = parts[1];
      }
    }

    // Normalize main name
    main_name = main_name
      .replace(/[\[\]"']/g, '') // Trim brackets, quotes
      .replace(/[.,!?;:]+$/, '') // Strip trailing punctuation
      .replace(/\s+/g, ' ')     // Collapse whitespace
      .trim();

    // Basic candidate detection
    if (main_name.length < 3 || (!hasPoiSuffix(main_name) && !isCapitalizedPhrase(main_name))) {
        continue;
    }
    
    candidates.push({
      raw: line,
      main_name,
      hint_city,
      position: position++,
    });
  }

  // De-duplication
  const uniqueCandidates = new Map<string, Candidate>();
  for (const candidate of candidates) {
    const key = `${candidate.main_name.toLowerCase().replace(/[^a-z0-9]/g, '')}|${candidate.hint_city?.toLowerCase() ?? ''}`;
    if (!uniqueCandidates.has(key)) {
      uniqueCandidates.set(key, candidate);
    } else {
        // Merge hint cities if a new one appears for a duplicate
        const existing = uniqueCandidates.get(key)!;
        if(candidate.hint_city && !existing.hint_city) {
            existing.hint_city = candidate.hint_city;
            uniqueCandidates.set(key, existing);
        }
    }
  }

  return Array.from(uniqueCandidates.values()).sort((a, b) => a.position - b.position);
}
