/** Best-effort client-side moderation for text encoded in generated bars. */

// Explicit policy for this tool: block common profanity and unambiguous slurs.
// Keep whole-word matching so ordinary names and technical terms remain usable.
const BLOCKED_TERMS = [
  'damn', 'hell', 'fuck', 'shit', 'bitch', 'ass', 'dick', 'piss',
  'cunt', 'cock', 'whore', 'bastard', 'slut', 'douche',
  'motherfucker', 'bullshit',
  'nigger', 'niggers', 'nigga', 'niggas', 'faggot', 'faggots',
  'kike', 'kikes', 'spic', 'spics', 'chink', 'chinks',
  'wetback', 'wetbacks', 'tranny', 'trannies', 'raghead', 'ragheads'
];

const CONFUSABLES = {
  'а': 'a', 'е': 'e', 'і': 'i', 'ї': 'i', 'о': 'o', 'р': 'p',
  'с': 'c', 'у': 'y', 'х': 'x', 'ѕ': 's', 'ӏ': 'l',
  'α': 'a', 'ε': 'e', 'ι': 'i', 'ο': 'o', 'ρ': 'p',
  'υ': 'u', 'χ': 'x'
};

const LEET_MAP = {
  a: '[a@4]', b: '[b8]', e: '[e3]', g: '[g9]',
  i: '[i1!|l]', l: '[l1!|i]', o: '[o0]', s: '[s$5]',
  t: '[t7+]', u: '[uv*]', v: '[vu]', z: '[z2]'
};

const TERM_PATTERNS = BLOCKED_TERMS.map(term => {
  const letters = Array.from(term, letter => LEET_MAP[letter] || letter);
  return new RegExp(`(^|[^a-z0-9])(${letters.join('[^a-z0-9]*')})(?=[^a-z0-9]|$)`, 'g');
});

function foldWithPositions(text) {
  let folded = '';
  const starts = [];
  const ends = [];

  for (let offset = 0; offset < text.length;) {
    const original = String.fromCodePoint(text.codePointAt(offset));
    const start = offset;
    offset += original.length;
    const normalized = original.normalize('NFKC').normalize('NFKD')
      .replace(/\p{M}/gu, '').toLowerCase();

    for (const character of normalized) {
      const mapped = CONFUSABLES[character] || character;
      folded += mapped;
      for (let index = 0; index < mapped.length; index++) {
        starts.push(start);
        ends.push(offset);
      }
    }
  }

  return { folded, starts, ends };
}

function findBlockedRanges(text) {
  const { folded, starts, ends } = foldWithPositions(text);
  const ranges = [];

  for (const pattern of TERM_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(folded))) {
      const first = match.index + match[1].length;
      const last = first + match[2].length - 1;
      ranges.push([starts[first], ends[last]]);
      if (pattern.lastIndex <= match.index) pattern.lastIndex = match.index + 1;
    }
  }

  return ranges.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

function hasProfanity(text) {
  return typeof text === 'string' && text.length > 0 && findBlockedRanges(text).length > 0;
}

function sanitizeText(text) {
  if (typeof text !== 'string' || !text) return text;
  const ranges = findBlockedRanges(text);
  if (!ranges.length) return text;

  let result = '';
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (end <= cursor) continue;
    result += text.slice(cursor, Math.max(cursor, start));
    result += '*'.repeat(end - Math.max(cursor, start));
    cursor = end;
  }
  return result + text.slice(cursor);
}

if (typeof window !== 'undefined') {
  window.ProfanityFilter = { hasProfanity, sanitizeText };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { hasProfanity, sanitizeText };
}
