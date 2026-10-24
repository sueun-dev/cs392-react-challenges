import { useEffect, useRef, useState } from 'react';
import { hasTimeClash } from './timeConflicts.js';
import './App.css';

type Course = {
  term: string;
  number: string;
  meets: string;
  title: string;
};

type Schedule = {
  title: string;
  courses: Record<string, Course>;
};

type Term = 'Fall' | 'Winter' | 'Spring';

const TermSelector = ({ selectedTerm, onSelect }: {
  selectedTerm: Term;
  onSelect: (term: Term) => void;
}) => (
  <div className="term-selector flex gap-1" role="group" aria-label="Academic term">
    {(['Fall', 'Winter', 'Spring'] as const).map(term => (
      <button
        key={term}
        type="button"
        aria-pressed={selectedTerm === term}
        onClick={() => onSelect(term)}
        className="term-button"
      >
        {term}
      </button>
    ))}
  </div>
);

const CourseCard = ({ courseId, course, isSelected, hasClash, onSelect }: {
  courseId: string;
  course: Course;
  isSelected: boolean;
  hasClash: boolean;
  onSelect: (courseId: string) => void;
}) => (
  <button
    type="button"
    aria-pressed={isSelected}
    disabled={hasClash}
    onClick={() => onSelect(courseId)}
    className="course-card flex w-full flex-col text-left disabled:opacity-40"
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
    <p className="course-meeting mt-5 pt-3">{course.meets}</p>
  </button>
);

const CourseList = ({ courses, selectedCourses, clashingCourseIds, onSelect }: {
  courses: [string, Course][];
  selectedCourses: string[];
  clashingCourseIds: string[];
  onSelect: (courseId: string) => void;
}) => (
  <ul className="flex flex-wrap gap-4">
    {courses.map(([courseId, course]) => (
      <li key={courseId} className="flex min-w-0 w-56 grow">
        <CourseCard courseId={courseId} course={course}
          isSelected={selectedCourses.includes(courseId)}
          hasClash={clashingCourseIds.includes(courseId)} onSelect={onSelect} />
      </li>
    ))}
  </ul>
);

const CoursePlan = ({ courses }: { courses: [string, Course][] }) => {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className="action-button"
        onClick={() => dialog.current?.showModal()}>
        Course plan
      </button>
      <dialog ref={dialog} aria-labelledby="course-plan-title" className="course-plan"
        onClick={event => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}>
        <div className="plan-content">
          <h2 id="course-plan-title">Course plan</h2>
          {courses.length === 0 ? (
            <p className="plan-empty">No courses selected. Click a course card to select it.</p>
          ) : (
            <ul className="plan-list">
              {courses.map(([courseId, course]) => (
                <li key={courseId}>
                  <h3>{course.term} CS {course.number}</h3>
                  <p>{course.title}</p>
                  <p className="plan-meeting">{course.meets}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="plan-footer flex justify-end">
            <button type="button" className="action-button"
              onClick={() => dialog.current?.close()}>
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};

const TermPage = ({ schedule }: { schedule: Schedule }) => {
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const visibleCourses = Object.entries(schedule.courses)
    .filter(([, course]) => course.term === selectedTerm);
  const plannedCourses: [string, Course][] = selectedCourses
    .map(courseId => [courseId, schedule.courses[courseId]]);
  const clashingCourseIds = visibleCourses
    .filter(([courseId, course]) => {
      if (selectedCourses.includes(courseId)) return false;
      return plannedCourses.some(([, pickedCourse]) => hasTimeClash(course, pickedCourse));
    })
    .map(([courseId]) => courseId);

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(current => {
      if (current.includes(courseId)) return current.filter(id => id !== courseId);
      if (current.some(id => hasTimeClash(schedule.courses[courseId], schedule.courses[id]))) {
        return current;
      }
      return [...current, courseId];
    });
  };

  return (
    <main className="course-page">
      <header className="page-heading">
        <h1>{schedule.title}</h1>
      </header>
      <div className="course-toolbar flex flex-wrap items-center justify-between gap-3">
        <TermSelector selectedTerm={selectedTerm} onSelect={setSelectedTerm} />
        <CoursePlan courses={plannedCourses} />
      </div>
      <CourseList courses={visibleCourses} selectedCourses={selectedCourses}
        clashingCourseIds={clashingCourseIds} onSelect={toggleCourse} />
    </main>
  );
};

const App = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    fetch('https://courses.cs.northwestern.edu/394/guides/data/cs-courses-firestore.php', {
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error('Could not load courses.');
        return response.json();
      })
      .then(data => setSchedule(data.schedules['CS-2018-2019']))
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load courses.');
      });

    return () => controller.abort();
  }, []);

  if (error) return <main className="course-page"><p role="alert">{error}</p></main>;
  if (!schedule) return <main className="course-page"><p role="status">Loading courses...</p></main>;

  return <TermPage schedule={schedule} />;
};

export default App;
