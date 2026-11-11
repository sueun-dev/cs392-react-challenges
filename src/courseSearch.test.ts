import { describe, expect, it } from 'vitest';
import { filterCourses, matchesQuery } from './courseSearch';
import type { Course } from './schedule';

const intro: Course = { term: 'Fall', number: '101', meets: 'MWF 11:00-11:50', title: 'Intro to Computing' };
const data: Course = { term: 'Fall', number: '214', meets: 'TuTh 9:00-10:20', title: 'Data Structures' };

describe('matchesQuery', () => {
  it('matches everything for an empty or blank query', () => {
    expect(matchesQuery(intro, '')).toBe(true);
    expect(matchesQuery(intro, '   ')).toBe(true);
  });

  it('matches the title regardless of case', () => {
    expect(matchesQuery(intro, 'COMPUTING')).toBe(true);
    expect(matchesQuery(intro, 'structures')).toBe(false);
  });

  it('matches part of the course number', () => {
    expect(matchesQuery(data, '21')).toBe(true);
    expect(matchesQuery(data, '101')).toBe(false);
  });

  it('requires every word to match', () => {
    expect(matchesQuery(data, 'data struct')).toBe(true);
    expect(matchesQuery(data, 'data computing')).toBe(false);
  });
});

describe('filterCourses', () => {
  const courses: [string, Course][] = [['a', intro], ['b', data]];

  it('keeps ids and order of the matching courses', () => {
    expect(filterCourses(courses, 'data')).toEqual([['b', data]]);
    expect(filterCourses(courses, '')).toEqual(courses);
  });
});
