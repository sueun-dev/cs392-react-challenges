type CourseMeeting = {
  term: string;
  meets: string;
};

export function hasTimeClash(courseA: CourseMeeting, courseB: CourseMeeting): boolean;
