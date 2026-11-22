import { readJson, writeJson } from './localJson';
import type { Course } from './schedule';

const STORAGE_KEY = 'course-notes';

export const noteMaxLength = 280;

export type CourseNotes = Record<string, string>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const filterNotes = (notes: CourseNotes, keep: (courseId: string) => boolean): CourseNotes =>
  Object.fromEntries(Object.entries(notes).filter(([courseId]) => keep(courseId)));

export const loadNotes = (): CourseNotes => {
  const saved = readJson(STORAGE_KEY);
  if (!isRecord(saved)) return {};
  return Object.fromEntries(
    Object.entries(saved).flatMap(([courseId, note]): [string, string][] =>
      typeof note === 'string' && note !== '' ? [[courseId, note.slice(0, noteMaxLength)]] : []));
};

export const saveNotes = (notes: CourseNotes) => writeJson(STORAGE_KEY, notes);

export const withNote = (notes: CourseNotes, courseId: string, text: string): CourseNotes =>
  text === ''
    ? filterNotes(notes, id => id !== courseId)
    : { ...notes, [courseId]: text.slice(0, noteMaxLength) };

export const keepExistingNotes = (notes: CourseNotes, courses: Record<string, Course>): CourseNotes =>
  filterNotes(notes, courseId => Object.hasOwn(courses, courseId));
