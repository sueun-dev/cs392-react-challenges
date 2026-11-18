const STORAGE_KEY = 'course-plan';

/** Course ids saved by the last visit. Anything missing or malformed counts as an empty plan. */
export const loadPlan = (): string[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const savePlan = (courseIds: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courseIds));
  } catch {
    // Storage can be blocked or full. The plan then lasts only until the page closes.
  }
};
