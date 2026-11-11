import type { Course } from './schedule';

export const dayCodes = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'] as const;

export type DayCode = (typeof dayCodes)[number];

export type Meeting = { days: DayCode[]; start: number; end: number };

const meetingPattern = /^((?:M|Tu|W|Th|F|Sa|Su)+) (\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;
const dayPattern = /Tu|Th|Sa|Su|M|W|F/g;

const minutesPerHour = 60;
const halfDay = 12 * minutesPerHour;
const earliestClassStart = 8 * minutesPerHour;

/** Reads a meeting such as "MWF 12:00-13:20" exactly as written, or returns null if it is malformed. */
export const readMeeting = (meets: string): Meeting | null => {
  const match = meetingPattern.exec(meets);
  if (!match) return null;

  const [, dayText, startHour, startMinute, endHour, endMinute] = match;
  if (Number(startHour) > 23 || Number(endHour) > 23) return null;
  if (Number(startMinute) > 59 || Number(endMinute) > 59) return null;

  return {
    days: dayText.match(dayPattern) as DayCode[],
    start: Number(startHour) * minutesPerHour + Number(startMinute),
    end: Number(endHour) * minutesPerHour + Number(endMinute),
  };
};

/**
 * Reads a meeting as it takes place. Some courses write afternoon times on a
 * 12-hour clock ("3:30-4:50"), and no class starts before 8:00, so earlier
 * starts are moved to the afternoon.
 */
export const parseMeeting = (meets: string): Meeting | null => {
  const meeting = readMeeting(meets);
  if (!meeting) return null;

  let { start, end } = meeting;
  if (start < earliestClassStart) {
    start += halfDay;
    if (end <= start) end += halfDay;
  }
  return end > start ? { ...meeting, start, end } : null;
};

export const hasTimeClash = (
  courseA: Pick<Course, 'term' | 'meets'>,
  courseB: Pick<Course, 'term' | 'meets'>,
) => {
  if (courseA.term !== courseB.term) return false;

  const meetingA = parseMeeting(courseA.meets);
  const meetingB = parseMeeting(courseB.meets);
  if (!meetingA || !meetingB) return false;

  const shareDay = meetingA.days.some(day => meetingB.days.includes(day));
  return shareDay && meetingA.start < meetingB.end && meetingB.start < meetingA.end;
};
