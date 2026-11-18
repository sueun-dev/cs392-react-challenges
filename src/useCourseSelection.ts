import { useEffect, useState } from 'react';
import { hasTimeClash } from './meetings';
import type { Course } from './schedule';

const STORAGE_KEY = 'course-plan';

const loadSavedIds = (): string[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const useCourseSelection = (courses: Record<string, Course>) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(loadSavedIds);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // Storage unavailable (private mode or quota): the plan just won't persist.
    }
  }, [selectedIds]);

  const plannedCourses = selectedIds.flatMap((courseId): [string, Course][] =>
    courses[courseId] ? [[courseId, courses[courseId]]] : []);

  const isBlocked = (courseId: string, course: Course) =>
    !selectedIds.includes(courseId)
    && plannedCourses.some(([, plannedCourse]) => hasTimeClash(course, plannedCourse));

  const toggleCourse = (courseId: string) => {
    setSelectedIds(current => {
      if (current.includes(courseId)) return current.filter(id => id !== courseId);
      const clashes = current.some(id => courses[id] && hasTimeClash(courses[courseId], courses[id]));
      return clashes ? current : [...current, courseId];
    });
  };

  return { selectedIds, plannedCourses, isBlocked, toggleCourse };
};
