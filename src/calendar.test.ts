import { describe, expect, it } from 'vitest';
import { buildCalendars, formatTime } from './calendar';

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
    expect(calendar.blocks[0]).toMatchObject({ courseId: 'f', number: '101', start: 660, end: 710 });
  });

  it('lists courses without a readable or visible meeting instead of dropping them', () => {
    const [calendar] = buildCalendars([
      ['f', fall],
      ['x', { ...fall, number: '999', meets: 'TBA' }],
      ['s', { ...fall, number: '998', meets: 'Sa 10:00-11:00' }],
    ]);
    expect(calendar.unscheduled).toEqual([
      { courseId: 'x', label: 'CS 999' },
      { courseId: 's', label: 'CS 998' },
    ]);
    expect(calendar.blocks).toHaveLength(3);
  });

  it('shows 8:00 to 17:00 at least and stretches for late classes', () => {
    const [plain] = buildCalendars([['f', fall]]);
    expect([plain.startHour, plain.endHour]).toEqual([8, 17]);

    const [evening] = buildCalendars([['e', { ...fall, meets: 'M 6:00-9:00' }]]);
    expect([evening.startHour, evening.endHour]).toEqual([8, 21]);
  });

  it('puts unknown terms after the known ones and returns nothing without courses', () => {
    const calendars = buildCalendars([['x', { ...fall, term: 'Intersession' }], ['f', fall]]);
    expect(calendars.map(({ term }) => term)).toEqual(['Fall', 'Intersession']);
    expect(buildCalendars([])).toEqual([]);
  });
});
