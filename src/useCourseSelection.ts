import { useState } from 'react';
import { hasTimeClash } from './meetings';
import type { Course } from './schedule';

export const useCourseSelection = (courses: Record<string, Course>) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
