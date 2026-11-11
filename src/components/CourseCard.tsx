import type { Course } from '../schedule';

type CourseCardProps = {
  courseId: string;
  course: Course;
  isSelected: boolean;
  hasClash: boolean;
  onSelect: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
};

const CourseCard = ({ courseId, course, isSelected, hasClash, onSelect, onEdit }: CourseCardProps) => (
  <div className="course-card flex w-full grow flex-col text-left"
    data-selected={isSelected} data-conflict={hasClash}>
    <button
      type="button"
      aria-pressed={isSelected}
      disabled={hasClash}
      onClick={() => onSelect(courseId)}
      className="flex w-full grow flex-col text-left disabled:cursor-not-allowed"
    >
      <h2 className="mb-3 flex w-full justify-between gap-2">
        <span>{course.term} CS {course.number}</span>
        {isSelected && (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" className="size-5 shrink-0">
            <path d="m5 12 4 4 10-10" />
          </svg>
        )}
      </h2>
      <p className="grow">{course.title}</p>
      <div className="course-meeting mt-5 pt-3">
        <p>{course.meets}</p>
        {hasClash && <p className="course-conflict">Time conflict</p>}
      </div>
    </button>
    {onEdit && (
      <button type="button" className="mt-2 self-start text-sm underline"
        onClick={() => onEdit(courseId)}>
        Edit {course.term} CS {course.number}
      </button>
    )}
  </div>
);

export default CourseCard;
