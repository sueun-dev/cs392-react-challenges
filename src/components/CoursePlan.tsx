import { useRef, useState } from 'react';
import type { Course } from '../schedule';
import SegmentedControl from './SegmentedControl';
import WeekCalendar from './WeekCalendar';

type PlanView = 'list' | 'calendar';

const planViews = [
  { value: 'list', label: 'List' },
  { value: 'calendar', label: 'Calendar' },
] as const;

const PlanList = ({ courses }: { courses: [string, Course][] }) => (
  <ul className="plan-list">
    {courses.map(([courseId, course]) => (
      <li key={courseId}>
        <h3>{course.term} CS {course.number}</h3>
        <p>{course.title}</p>
        <p className="plan-meeting">{course.meets}</p>
      </li>
    ))}
  </ul>
);

const CoursePlan = ({ courses }: { courses: [string, Course][] }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<PlanView>('list');

  return (
    <>
      <button type="button" className="action-button"
        onClick={() => dialog.current?.showModal()}>
        Course plan ({courses.length})
      </button>
      <dialog ref={dialog} aria-labelledby="course-plan-title" className="course-plan"
        data-view={view}
        onClick={event => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}>
        <div className="plan-content">
          <h2 id="course-plan-title">Course plan</h2>
          {courses.length === 0 ? (
            <p className="plan-empty">No courses selected. Click a course card to select it.</p>
          ) : (
            <>
              <SegmentedControl label="Plan view" className="plan-view-selector"
                options={planViews} value={view} onChange={setView} />
              {view === 'calendar' ? <WeekCalendar courses={courses} /> : <PlanList courses={courses} />}
            </>
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

export default CoursePlan;
