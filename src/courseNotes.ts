import type { Course } from './schedule';

const STORAGE_KEY = 'course-notes';

export const noteMaxLength = 280;

export type CourseNotes = Record<string, string>;

export const loadNotes = (): CourseNotes => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return {};
    return Object.fromEntries(
      Object.entries(saved).filter(([, note]) => typeof note === 'string' && note !== ''));
  } catch {
    return {};
  }
};

export const saveNotes = (notes: CourseNotes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    return;
  }
};

export const withNote = (notes: CourseNotes, courseId: string, text: string): CourseNotes =>
  text === ''
    ? Object.fromEntries(Object.entries(notes).filter(([id]) => id !== courseId))
    : { ...notes, [courseId]: text.slice(0, noteMaxLength) };

export const keepExistingNotes = (notes: CourseNotes, courses: Record<string, Course>): CourseNotes =>
  Object.fromEntries(Object.entries(notes).filter(([courseId]) => Object.hasOwn(courses, courseId)));
