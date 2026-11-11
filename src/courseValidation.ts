import { readMeeting } from './meetings';
import { termOrder, type Course } from './schedule';

export type CourseErrors = Record<keyof Course, string>;

const titleError = (value: string) =>
  value.trim().length >= 2 ? '' : 'Title must have at least 2 characters.';

const termError = (value: string) =>
  termOrder.includes(value) ? '' : 'Use Fall, Winter, Spring, or Summer.';

const numberError = (value: string) =>
  /^\d+(?:-\d+)?$/.test(value) ? '' : 'Use a number, e.g., 213 or 213-2.';

const meetsError = (value: string) => {
  if (value === '') return '';

  const meeting = readMeeting(value);
  if (!meeting) return 'Use days and start-end, e.g., MWF 12:00-13:20.';
  if (new Set(meeting.days).size !== meeting.days.length) return 'List each day only once.';
  return meeting.start < meeting.end ? '' : 'End time must be after start time.';
};

export const validateCourse = (course: Course): CourseErrors => ({
  title: titleError(course.title),
  term: termError(course.term),
  number: numberError(course.number),
  meets: meetsError(course.meets),
});
