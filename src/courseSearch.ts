import { readMeeting, type DayCode } from './meetings';
import type { Course } from './schedule';

type Candidate = { number: string; words: string[]; days: DayCode[] };

const dayNames: [string, DayCode][] = [
  ['monday', 'M'], ['tuesday', 'Tu'], ['wednesday', 'W'], ['thursday', 'Th'],
  ['friday', 'F'], ['saturday', 'Sa'], ['sunday', 'Su'],
];

const minimumDayNameLength = 3;
const minimumFuzzyLength = 4;
const subjectPrefix = 'cs';

const normalize = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const tokenize = (text: string) => normalize(text).split(' ').filter(Boolean);

/** "cs101" and "cs 101" both mean the course number 101, and a bare "cs" says nothing. */
const queryTokens = (query: string) =>
  tokenize(query)
    .map(token => (/^cs\d/.test(token) ? token.slice(subjectPrefix.length) : token))
    .filter(token => token !== subjectPrefix);

/** Edit distance where swapping two neighbouring letters counts as one edit. */
export const editDistance = (a: string, b: string) => {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
};

/** Longer words forgive more typing mistakes; very short ones must be exact. */
const allowedEdits = (length: number) => {
  if (length < minimumFuzzyLength) return 0;
  return length < 6 ? 1 : 2;
};

/** Lower is better; null means the token does not match this course. */
const scoreToken = (token: string, { number, words, days }: Candidate): number | null => {
  if (/^\d+$/.test(token)) {
    if (number === token) return 0;
    if (number.startsWith(token)) return 1;
    return number.includes(token) ? 3 : null;
  }

  let best: number | null = null;
  const consider = (score: number) => {
    best = best === null ? score : Math.min(best, score);
  };

  for (const word of words) {
    if (word === token) consider(0);
    else if (word.startsWith(token)) consider(1);
    else if (token.length >= minimumDayNameLength && word.includes(token)) consider(3);

    const edits = allowedEdits(token.length);
    if (edits > 0) {
      const distance = Math.min(editDistance(token, word), editDistance(token, word.slice(0, token.length)));
      if (distance <= edits) consider(4 + distance);
    }
  }

  if (token.length >= minimumDayNameLength) {
    const meetsOnDay = dayNames.some(([name, code]) => name.startsWith(token) && days.includes(code));
    if (meetsOnDay) consider(2);
  }
  return best;
};

const toCandidate = (course: Course): Candidate => ({
  number: normalize(course.number),
  words: tokenize(course.title),
  days: readMeeting(course.meets)?.days ?? [],
});

/**
 * Scores a course against a search text, or returns null when it does not match.
 * Every word must match the course number, a word of the title, or a meeting day.
 * Small typing mistakes are forgiven, and exact and prefix matches score better.
 */
export const scoreCourse = (course: Course, query: string): number | null => {
  const tokens = queryTokens(query);
  const candidate = toCandidate(course);
  let total = 0;

  for (const token of tokens) {
    const score = scoreToken(token, candidate);
    if (score === null) return null;
    total += score;
  }
  return total;
};

/** Keeps the matching courses, best match first. Ties and empty searches keep the original order. */
export const filterCourses = (courses: [string, Course][], query: string) => {
  if (queryTokens(query).length === 0) return courses;

  return courses
    .flatMap(([courseId, course], index) => {
      const score = scoreCourse(course, query);
      return score === null ? [] : [{ entry: [courseId, course] as [string, Course], score, index }];
    })
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ entry }) => entry);
};
