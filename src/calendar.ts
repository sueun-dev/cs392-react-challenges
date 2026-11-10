export type CalendarCourse = {
  term: string;
  number: string;
  meets: string;
  title: string;
};

export const weekdays = [
  { key: 'M', short: 'Mon', name: 'Monday' },
  { key: 'Tu', short: 'Tue', name: 'Tuesday' },
  { key: 'W', short: 'Wed', name: 'Wednesday' },
  { key: 'Th', short: 'Thu', name: 'Thursday' },
  { key: 'F', short: 'Fri', name: 'Friday' },
] as const;

export type DayKey = (typeof weekdays)[number]['key'];

export type Meeting = { days: DayKey[]; start: number; end: number };

export type CalendarBlock = {
  courseId: string;
  number: string;
  label: string;
  title: string;
  day: DayKey;
  start: number;
  end: number;
};

export type TermCalendar = {
  term: string;
  blocks: CalendarBlock[];
  unscheduled: { courseId: string; label: string }[];
  startHour: number;
  endHour: number;
};

const termOrder = ['Fall', 'Winter', 'Spring'];
const firstClassMinute = 8 * 60;
const defaultStartHour = 8;
const defaultEndHour = 17;

const minutesInHalfDay = 12 * 60;

const readClock = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Some courses write afternoon times on a 12-hour clock ("3:30-4:50", "6:00-9:00"); no class starts before 8.
export const parseMeeting = (meets: string): Meeting | null => {
  const match = /^((?:M|Tu|W|Th|F)+) (\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/.exec(meets.trim());
  if (!match) return null;

  const days = match[1].match(/M|Tu|W|Th|F/g) as DayKey[];
  let start = readClock(match[2]);
  let end = readClock(match[3]);
  if (start < firstClassMinute) {
    start += minutesInHalfDay;
    if (end <= start) end += minutesInHalfDay;
  }
  return end > start ? { days, start, end } : null;
};

export const formatTime = (minutes: number) =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

const byTerm = (a: string, b: string) => {
  const rank = (term: string) => termOrder.includes(term) ? termOrder.indexOf(term) : termOrder.length;
  return rank(a) - rank(b);
};

export const buildCalendars = (courses: [string, CalendarCourse][]): TermCalendar[] => {
  const terms = [...new Set(courses.map(([, course]) => course.term))].sort(byTerm);

  return terms.map(term => {
    const blocks: CalendarBlock[] = [];
    const unscheduled: TermCalendar['unscheduled'] = [];

    courses.filter(([, course]) => course.term === term).forEach(([courseId, course]) => {
      const label = `CS ${course.number}`;
      const meeting = parseMeeting(course.meets);
      if (!meeting) {
        unscheduled.push({ courseId, label });
        return;
      }
      meeting.days.forEach(day => blocks.push({
        courseId, number: course.number, label, title: course.title, day, start: meeting.start, end: meeting.end,
      }));
    });

    const endHour = Math.max(defaultEndHour, ...blocks.map(({ end }) => Math.ceil(end / 60)));
    return { term, blocks, unscheduled, startHour: defaultStartHour, endHour };
  });
};
