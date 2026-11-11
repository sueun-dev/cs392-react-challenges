import type { Course } from './schedule';

export const matchesQuery = (course: Course, query: string) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${course.number} ${course.title}`.toLowerCase();
  return words.every(word => text.includes(word));
};

export const filterCourses = (courses: [string, Course][], query: string) =>
  courses.filter(([, course]) => matchesQuery(course, query));
