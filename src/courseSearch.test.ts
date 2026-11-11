import { describe, expect, it } from 'vitest';
import { editDistance, filterCourses, scoreCourse } from './courseSearch';
import type { Course } from './schedule';

const course = (number: string, title: string, meets = 'MWF 11:00-11:50'): Course =>
  ({ term: 'Fall', number, meets, title });

const intro = course('101', 'Intro to Computing');
const data = course('214', 'Data Structures', 'TuTh 9:00-10:20');
const programming = course('111', 'Programming Languages', 'TuTh 1:00-2:20');

const matches = (target: Course, query: string) => scoreCourse(target, query) !== null;

describe('editDistance', () => {
  it('counts insertions, deletions, substitutions and swapped neighbours', () => {
    expect(editDistance('data', 'data')).toBe(0);
    expect(editDistance('dat', 'data')).toBe(1);
    expect(editDistance('dota', 'data')).toBe(1);
    expect(editDistance('dtaa', 'data')).toBe(1);
    expect(editDistance('abc', 'xyz')).toBe(3);
  });
});

describe('scoreCourse', () => {
  it('matches everything for an empty or blank search, and for a bare "cs"', () => {
    expect(filterCourses([['a', intro]], '')).toHaveLength(1);
    expect(filterCourses([['a', intro]], '   ')).toHaveLength(1);
    expect(filterCourses([['a', intro]], 'cs')).toHaveLength(1);
  });

  it('matches title words regardless of case, accents and punctuation', () => {
    expect(matches(intro, 'COMPUTING')).toBe(true);
    expect(matches(intro, 'intro, to computing!')).toBe(true);
    expect(matches(course('300', 'Café Design'), 'cafe')).toBe(true);
    expect(matches(data, 'computing')).toBe(false);
  });

  it('matches course numbers with or without the CS prefix', () => {
    expect(matches(data, '214')).toBe(true);
    expect(matches(data, 'cs214')).toBe(true);
    expect(matches(data, 'CS 214')).toBe(true);
    expect(matches(data, '21')).toBe(true);
    expect(matches(data, '101')).toBe(false);
  });

  it('matches the start of a word as it is typed', () => {
    expect(matches(data, 'struct')).toBe(true);
    expect(matches(data, 'dat')).toBe(true);
  });

  it('forgives small typing mistakes in longer words', () => {
    expect(matches(intro, 'computin')).toBe(true);
    expect(matches(intro, 'compting')).toBe(true);
    expect(matches(intro, 'comptuing')).toBe(true);
    expect(matches(programming, 'progrmaing')).toBe(true);
    expect(matches(programming, 'langauges')).toBe(true);
  });

  it('does not guess for short words or for words that are too different', () => {
    expect(matches(data, 'dxt')).toBe(false);
    expect(matches(intro, 'cmputr')).toBe(true);
    expect(matches(intro, 'banana')).toBe(false);
    expect(matches(data, 'strokes')).toBe(false);
  });

  it('matches the days a course meets', () => {
    expect(matches(data, 'tuesday')).toBe(true);
    expect(matches(data, 'thu')).toBe(true);
    expect(matches(data, 'monday')).toBe(false);
    expect(matches(intro, 'friday')).toBe(true);
    expect(matches(course('400', 'Seminar', 'TBA'), 'monday')).toBe(false);
  });

  it('requires every word to match', () => {
    expect(matches(data, 'data struct')).toBe(true);
    expect(matches(data, 'data tuesday')).toBe(true);
    expect(matches(data, 'data computing')).toBe(false);
    expect(matches(data, '214 data')).toBe(true);
  });
});

describe('filterCourses', () => {
  it('lists whole-word matches before prefix matches and keeps the order of equal matches', () => {
    const courses: [string, Course][] = [
      ['a', course('310', 'Advanced Data Systems')],
      ['b', course('201', 'Database Design')],
      ['c', course('105', 'Data')],
      ['d', course('220', 'Data Analysis')],
    ];
    expect(filterCourses(courses, 'data').map(([id]) => id)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('puts an exact course number before a partial one', () => {
    const courses: [string, Course][] = [['a', course('1010', 'Topics')], ['b', course('101', 'Intro')]];
    expect(filterCourses(courses, '101').map(([id]) => id)).toEqual(['b', 'a']);
  });

  it('keeps ids and the original order for an empty search', () => {
    const courses: [string, Course][] = [['a', intro], ['b', data]];
    expect(filterCourses(courses, '')).toBe(courses);
  });
});
