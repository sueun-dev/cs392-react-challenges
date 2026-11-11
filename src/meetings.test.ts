import { describe, expect, it } from 'vitest';
import { hasTimeClash, parseMeeting, readMeeting } from './meetings';

describe('readMeeting', () => {
  it('reads days and 24-hour times as written', () => {
    expect(readMeeting('MWF 11:00-11:50')).toEqual({ days: ['M', 'W', 'F'], start: 660, end: 710 });
    expect(readMeeting('TuTh 14:00-15:20')).toEqual({ days: ['Tu', 'Th'], start: 840, end: 920 });
    expect(readMeeting('SaSu 9:05-10:00')).toEqual({ days: ['Sa', 'Su'], start: 545, end: 600 });
  });

  it('keeps a start that is later than the end', () => {
    expect(readMeeting('MWF 12:00-11:00')).toMatchObject({ start: 720, end: 660 });
  });

  it('returns null for text that is not a meeting', () => {
    for (const meets of ['', 'TBA', 'MWF', 'MWF 11:00', 'Mo 10:00-11:00', 'M 10:00-11:00 ', 'M 24:00-25:00', 'M 10:60-11:00']) {
      expect(readMeeting(meets)).toBeNull();
    }
  });
});

describe('parseMeeting', () => {
  it('matches readMeeting for times that are already on a 24-hour clock', () => {
    expect(parseMeeting('Tu 14:00-17:10')).toEqual(readMeeting('Tu 14:00-17:10'));
    expect(parseMeeting('TuTh 9:00-10:20')).toMatchObject({ start: 540, end: 620 });
  });

  it('treats early hours written on a 12-hour clock as the afternoon', () => {
    expect(parseMeeting('TuTh 3:30-4:50')).toMatchObject({ start: 15 * 60 + 30, end: 16 * 60 + 50 });
    expect(parseMeeting('M 6:00-9:00')).toMatchObject({ start: 18 * 60, end: 21 * 60 });
  });

  it('returns null when the meeting cannot be read or ends before it starts', () => {
    expect(parseMeeting('TBA')).toBeNull();
    expect(parseMeeting('MWF 12:00-11:00')).toBeNull();
  });
});

describe('hasTimeClash', () => {
  const course = (meets: string, term = 'Fall') => ({ term, meets });

  it('detects courses that share a day and overlap in time', () => {
    expect(hasTimeClash(course('MWF 11:00-11:50'), course('MW 11:30-12:20'))).toBe(true);
  });

  it('allows courses on different days, in different terms, or back to back', () => {
    expect(hasTimeClash(course('MWF 11:00-11:50'), course('TuTh 11:00-11:50'))).toBe(false);
    expect(hasTimeClash(course('MWF 11:00-11:50'), course('MWF 11:00-11:50', 'Winter'))).toBe(false);
    expect(hasTimeClash(course('MWF 11:00-11:50'), course('MWF 11:50-12:40'))).toBe(false);
  });

  it('compares 12-hour afternoon times with 24-hour times', () => {
    expect(hasTimeClash(course('TuTh 3:30-4:50'), course('TuTh 15:00-16:00'))).toBe(true);
    expect(hasTimeClash(course('TuTh 3:30-4:50'), course('TuTh 9:00-10:20'))).toBe(false);
  });

  it('never reports a clash for a course without a readable meeting', () => {
    expect(hasTimeClash(course(''), course('MWF 11:00-11:50'))).toBe(false);
    expect(hasTimeClash(course('TBA'), course('MWF 11:00-11:50'))).toBe(false);
  });
});
