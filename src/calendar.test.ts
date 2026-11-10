import { describe, expect, it } from 'vitest';
import { buildCalendars, formatTime, parseMeeting } from './calendar';

describe('parseMeeting', () => {
  it('reads days and 24-hour times', () => {
    expect(parseMeeting('MWF 11:00-11:50')).toEqual({ days: ['M', 'W', 'F'], start: 660, end: 710 });
    expect(parseMeeting('TuTh 14:00-15:20')).toEqual({ days: ['Tu', 'Th'], start: 840, end: 920 });
  });

  it('reads one-day meetings', () => {
    expect(parseMeeting('Tu 14:00-17:10')?.days).toEqual(['Tu']);
    expect(parseMeeting('Th 14:00-17:00')?.days).toEqual(['Th']);
  });

  it('treats early hours written on a 12-hour clock as the afternoon', () => {
    expect(parseMeeting('TuTh 3:30-4:50')).toMatchObject({ start: 15 * 60 + 30, end: 16 * 60 + 50 });
    expect(parseMeeting('M 6:00-9:00')).toMatchObject({ start: 18 * 60, end: 21 * 60 });
  });

  it('keeps morning times in the morning', () => {
    expect(parseMeeting('TuTh 9:00-10:20')).toMatchObject({ start: 540, end: 620 });
  });

  it('returns null when the meeting cannot be read', () => {
    expect(parseMeeting('')).toBeNull();
    expect(parseMeeting('TBA')).toBeNull();
    expect(parseMeeting('MWF 12:00-11:00')).toBeNull();
    expect(parseMeeting('Sa 10:00-11:00')).toBeNull();
  });
});

describe('formatTime', () => {
  it('writes minutes as hours and padded minutes', () => {
    expect(formatTime(11 * 60)).toBe('11:00');
    expect(formatTime(15 * 60 + 5)).toBe('15:05');
  });
});

describe('buildCalendars', () => {
  const fall = { term: 'Fall', number: '101', meets: 'MWF 11:00-11:50', title: 'Intro' };
  const winter = { term: 'Winter', number: '110', meets: 'Tu 10:00-11:00', title: 'Programming' };

  it('makes one calendar per term in term order', () => {
    const calendars = buildCalendars([['w', winter], ['f', fall]]);
    expect(calendars.map(({ term }) => term)).toEqual(['Fall', 'Winter']);
  });

  it('adds one block per meeting day', () => {
    const [calendar] = buildCalendars([['f', fall]]);
    expect(calendar.blocks.map(({ day }) => day)).toEqual(['M', 'W', 'F']);
    expect(calendar.blocks[0]).toMatchObject({ courseId: 'f', label: 'CS 101', start: 660, end: 710 });
  });

  it('lists courses without a readable meeting instead of dropping them', () => {
    const [calendar] = buildCalendars([['f', fall], ['x', { ...fall, number: '999', meets: 'TBA' }]]);
    expect(calendar.unscheduled).toEqual([{ courseId: 'x', label: 'CS 999' }]);
    expect(calendar.blocks).toHaveLength(3);
  });

  it('shows 8:00 to 17:00 at least and stretches for late classes', () => {
    const [plain] = buildCalendars([['f', fall]]);
    expect([plain.startHour, plain.endHour]).toEqual([8, 17]);

    const [evening] = buildCalendars([['e', { ...fall, meets: 'M 6:00-9:00' }]]);
    expect([evening.startHour, evening.endHour]).toEqual([8, 21]);
  });

  it('returns nothing when no courses are selected', () => {
    expect(buildCalendars([])).toEqual([]);
  });
});
