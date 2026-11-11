import type { Course } from '../schedule';
import CourseCard from './CourseCard';

type CourseListProps = {
  courses: [string, Course][];
  selectedIds: string[];
  clashingIds: string[];
  onSelect: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
};

const CourseList = ({ courses, selectedIds, clashingIds, onSelect, onEdit }: CourseListProps) => (
  <ul className="flex flex-wrap gap-4">
    {courses.map(([courseId, course]) => (
      <li key={courseId} className="flex min-w-0 w-56 grow flex-col">
        <CourseCard courseId={courseId} course={course}
          isSelected={selectedIds.includes(courseId)}
          hasClash={clashingIds.includes(courseId)} onSelect={onSelect} onEdit={onEdit} />
      </li>
    ))}
  </ul>
);

export default CourseList;
