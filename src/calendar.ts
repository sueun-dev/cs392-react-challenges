import { parseMeeting, type DayCode } from './meetings';
import { termOrder, type Course } from './schedule';

export const weekdays = [
  { code: 'M', short: 'Mon', name: 'Monday' },
  { code: 'Tu', short: 'Tue', name: 'Tuesday' },
  { code: 'W', short: 'Wed', name: 'Wednesday' },
  { code: 'Th', short: 'Thu', name: 'Thursday' },
  { code: 'F', short: 'Fri', name: 'Friday' },
] as const satisfies readonly { code: DayCode; short: string; name: string }[];

export type CalendarBlock = {
  courseId: string;
  number: string;
  title: string;
  day: DayCode;
  start: number;
  end: number;
};

export type UnscheduledCourse = { courseId: string; label: string };

export type TermCalendar = {
  term: string;
  blocks: CalendarBlock[];
  unscheduled: UnscheduledCourse[];
  startHour: number;
  endHour: number;
};

const firstVisibleHour = 8;
const minimumLastHour = 17;

export const formatTime = (minutes: number) =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

const termRank = (term: string) => {
  const rank = termOrder.indexOf(term);
  return rank === -1 ? termOrder.length : rank;
};

const buildTermCalendar = (term: string, courses: [string, Course][]): TermCalendar => {
  const blocks: CalendarBlock[] = [];
  const unscheduled: UnscheduledCourse[] = [];

  for (const [courseId, course] of courses) {
    const meeting = parseMeeting(course.meets);
    const days = weekdays.filter(({ code }) => meeting?.days.includes(code));

    if (!meeting || days.length === 0) {
      unscheduled.push({ courseId, label: `CS ${course.number}` });
      continue;
    }
    for (const { code } of days) {
      blocks.push({
        courseId, number: course.number, title: course.title, day: code, start: meeting.start, end: meeting.end,
      });
    }
  }

  const lastHour = Math.max(minimumLastHour, ...blocks.map(({ end }) => Math.ceil(end / 60)));
  return { term, blocks, unscheduled, startHour: firstVisibleHour, endHour: lastHour };
};

export const buildCalendars = (courses: [string, Course][]): TermCalendar[] =>
  [...new Set(courses.map(([, course]) => course.term))]
    .sort((a, b) => termRank(a) - termRank(b))
    .map(term => buildTermCalendar(term, courses.filter(([, course]) => course.term === term)));
