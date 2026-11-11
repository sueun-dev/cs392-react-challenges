export type Course = {
  term: string;
  number: string;
  meets: string;
  title: string;
};

export type Schedule = {
  title: string;
  courses: Record<string, Course>;
};

export const selectableTerms = ['Fall', 'Winter', 'Spring'] as const;

export type Term = (typeof selectableTerms)[number];

export const termOrder: readonly string[] = [...selectableTerms, 'Summer'];

export const isSchedule = (data: unknown): data is Schedule =>
  typeof data === 'object' && data !== null
  && 'title' in data && typeof data.title === 'string'
  && 'courses' in data && typeof data.courses === 'object' && data.courses !== null;
