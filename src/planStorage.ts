import { readJson, writeJson } from './localJson';

const STORAGE_KEY = 'course-plan';

/** Course ids saved by the last visit. Anything missing or malformed counts as an empty plan. */
export const loadPlan = (): string[] => {
  const saved = readJson(STORAGE_KEY);
  return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
};

export const savePlan = (courseIds: string[]) => writeJson(STORAGE_KEY, courseIds);
