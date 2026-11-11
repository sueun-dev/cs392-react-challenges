import { useState } from 'react';
import type { User } from 'firebase/auth';
import AuthControls from './components/AuthControls';
import CourseForm from './components/CourseForm';
import CourseList from './components/CourseList';
import CoursePlan from './components/CoursePlan';
import SegmentedControl from './components/SegmentedControl';
import { isSchedule, selectableTerms, type Schedule, type Term } from './schedule';
import { useCourseSelection } from './useCourseSelection';
import { useAuthState, useDataQuery, useIsAdmin } from './utilities/firebase';
import './App.css';

const termOptions = selectableTerms.map(term => ({ value: term, label: term }));

const accessHint = (user: User | null, isAdmin: boolean) => {
  if (isAdmin) return '';
  return user
    ? 'You are signed in without edit access. Only administrators can edit courses.'
    : 'Administrators can sign in to edit courses.';
};

const TermPage = ({ schedule, user, isAdmin }: {
  schedule: Schedule;
  user: User | null;
  isAdmin: boolean;
}) => {
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const { selectedIds, plannedCourses, isBlocked, toggleCourse } = useCourseSelection(schedule.courses);

  const visibleCourses = Object.entries(schedule.courses)
    .filter(([, course]) => course.term === selectedTerm);
  const clashingIds = visibleCourses
    .filter(([courseId, course]) => isBlocked(courseId, course))
    .map(([courseId]) => courseId);

  if (!isAdmin && editingCourseId !== null) setEditingCourseId(null);

  const editingCourse = isAdmin && editingCourseId !== null
    ? schedule.courses[editingCourseId]
    : undefined;
  if (editingCourseId !== null && editingCourse) {
    return <CourseForm courseId={editingCourseId} course={editingCourse}
      onCancel={() => setEditingCourseId(null)} />;
  }

  return (
    <main className="course-page">
      <header className="page-heading">
        <h1>{schedule.title}</h1>
      </header>
      <div className="course-toolbar flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl label="Academic term" options={termOptions}
          value={selectedTerm} onChange={setSelectedTerm} />
        <div className="flex flex-wrap items-center gap-3">
          <AuthControls user={user} isAdmin={isAdmin} />
          <CoursePlan courses={plannedCourses} />
        </div>
      </div>
      <p className="course-hint">
        Select a card to add it, or click it again to remove it. Conflicting courses are marked below.
        {' '}{accessHint(user, isAdmin)}
      </p>
      <CourseList courses={visibleCourses} selectedIds={selectedIds}
        clashingIds={clashingIds} onSelect={toggleCourse}
        onEdit={isAdmin ? setEditingCourseId : undefined} />
    </main>
  );
};

const PageMessage = ({ role, children }: { role: 'status' | 'alert'; children: string }) => (
  <main className="course-page"><p role={role}>{children}</p></main>
);

const App = () => {
  const [schedule, isLoading, queryError] = useDataQuery('/');
  const user = useAuthState();
  const [isAdmin, isAdminLoading] = useIsAdmin(user);

  if (isLoading || user === undefined || isAdminLoading) {
    return <PageMessage role="status">Loading courses...</PageMessage>;
  }
  if (queryError || !isSchedule(schedule)) {
    return <PageMessage role="alert">Could not load courses.</PageMessage>;
  }

  return <TermPage schedule={schedule} user={user} isAdmin={isAdmin} />;
};

export default App;
