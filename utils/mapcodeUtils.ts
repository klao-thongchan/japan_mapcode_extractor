
import { MAPCODE_REGEX } from '../constants';

export function normaliseMapcode(input: string): string {
  if (!input) return '';
  const s = input
    .replace(/[＊✱⭐️•·]/g, '*')
    .replace(/[^\d*\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const m = s.match(/^(\d{1,3})\s(\d{3})\s(\d{3})\*(\d{2})$/);
  if (!m) return s; // Return semi-cleaned string if format is wrong

  const b1 = String(parseInt(m[1], 10)); // strip leading zeros
  const b2 = m[2];
  const b3 = m[3];
  
  return `${b1} ${b2} ${b3}*${m[4]}`;
}

export function validateMapcode(input: string | null | undefined): boolean {
  if (!input) return true; // Empty is not invalid
  return MAPCODE_REGEX.test(input);
}
