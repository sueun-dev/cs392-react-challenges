import { describe, expect, it } from 'vitest';
import { validateCourse } from './courseValidation';

const valid = { title: 'Intro to Computing', term: 'Fall', number: '101', meets: 'MWF 11:00-11:50' };

describe('validateCourse', () => {
  it('accepts a complete course and a course without a meeting time', () => {
    expect(Object.values(validateCourse(valid)).every(error => error === '')).toBe(true);
    expect(validateCourse({ ...valid, meets: '' }).meets).toBe('');
  });

  it('requires a title of at least two characters', () => {
    expect(validateCourse({ ...valid, title: ' a ' }).title).toMatch(/at least 2 characters/);
  });

  it('only allows the known terms', () => {
    expect(validateCourse({ ...valid, term: 'Summer' }).term).toBe('');
    expect(validateCourse({ ...valid, term: 'Autumn' }).term).toMatch(/Fall, Winter, Spring, or Summer/);
  });

  it('allows a course number with an optional section', () => {
    expect(validateCourse({ ...valid, number: '213-2' }).number).toBe('');
    expect(validateCourse({ ...valid, number: 'CS213' }).number).toMatch(/Use a number/);
  });

  it('explains what is wrong with a meeting time', () => {
    expect(validateCourse({ ...valid, meets: 'noon' }).meets).toMatch(/Use days and start-end/);
    expect(validateCourse({ ...valid, meets: 'MM 10:00-11:00' }).meets).toMatch(/each day only once/);
    expect(validateCourse({ ...valid, meets: 'MWF 12:00-11:00' }).meets).toMatch(/End time must be after start time/);
  });
});
