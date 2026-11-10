import { useRef, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { hasTimeClash } from './timeConflicts.js';
import {
  signInWithGoogle, signOutUser, updateData, useAuthState, useDataQuery, useIsAdmin,
} from './utilities/firebase';
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

const CourseCard = ({ courseId, course, isSelected, hasClash, onSelect, onEdit }: {
  courseId: string;
  course: Course;
  isSelected: boolean;
  hasClash: boolean;
  onSelect: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
}) => (
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

const CourseList = ({ courses, selectedCourses, clashingCourseIds, onSelect, onEdit }: {
  courses: [string, Course][];
  selectedCourses: string[];
  clashingCourseIds: string[];
  onSelect: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
}) => (
  <ul className="flex flex-wrap gap-4">
    {courses.map(([courseId, course]) => (
      <li key={courseId} className="flex min-w-0 w-56 grow flex-col">
        <CourseCard courseId={courseId} course={course}
          isSelected={selectedCourses.includes(courseId)}
          hasClash={clashingCourseIds.includes(courseId)} onSelect={onSelect} onEdit={onEdit} />
      </li>
    ))}
  </ul>
);

const meetingError = (value: string) => {
  if (value === '') return '';
  const meetPieces = value.match(/^((?:M|Tu|W|Th|F|Sa|Su)+) ([01]?\d|2[0-3]):([0-5]\d)-([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!meetPieces) return 'Use days and start-end, e.g., MWF 12:00-13:20.';
  const dayBits: string[] = meetPieces[1].match(/Tu|Th|Sa|Su|M|W|F/g) ?? [];
  if (new Set(dayBits).size !== dayBits.length) return 'List each day only once.';
  const beginMinute = Number(meetPieces[2]) * 60 + Number(meetPieces[3]);
  const finishMinute = Number(meetPieces[4]) * 60 + Number(meetPieces[5]);
  return beginMinute < finishMinute ? '' : 'End time must be after start time.';
};

const courseSchema: Record<keyof Course, (value: string) => string> = {
  title: value => value.trim().length >= 2 ? '' : 'Title must have at least 2 characters.',
  term: value => ['Fall', 'Winter', 'Spring', 'Summer'].includes(value)
    ? '' : 'Use Fall, Winter, Spring, or Summer.',
  number: value => /^\d+(?:-\d+)?$/.test(value) ? '' : 'Use a number, e.g., 213 or 213-2.',
  meets: meetingError,
};

const validateCourse = (course: Course) => ({
  title: courseSchema.title(course.title),
  term: courseSchema.term(course.term),
  number: courseSchema.number(course.number),
  meets: courseSchema.meets(course.meets),
});

const courseFields = [
  { name: 'title', label: 'Title', hint: 'At least 2 characters.' },
  { name: 'term', label: 'Term', hint: 'Fall, Winter, Spring, or Summer.' },
  { name: 'number', label: 'Course number', hint: 'A number with an optional section, e.g., 213-2.' },
  { name: 'meets', label: 'Meeting times', hint: 'For example, MWF 12:00-13:20. Leave blank if unscheduled.' },
] as const;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const saveMessages: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'Saved.',
  error: 'Could not save. Make sure you are signed in, then try again.',
};

const CourseField = ({ name, label, hint, value, error, onChange }: {
  name: keyof Course;
  label: string;
  hint: string;
  value: string;
  error: string;
  onChange: (name: keyof Course, value: string) => void;
}) => (
  <div className="course-field" data-field={name}>
    <label htmlFor={`course-${name}`}>{label}</label>
    <input id={`course-${name}`} name={name} type="text"
      value={value} autoFocus={name === 'title'}
      aria-invalid={Boolean(error)}
      aria-describedby={`${name}-message`}
      onChange={event => onChange(name, event.target.value)} />
    <p id={`${name}-message`} className={error ? 'field-error' : 'field-hint'}
      aria-live="polite">
      {error || hint}
    </p>
  </div>
);

const CourseForm = ({ courseId, course, onCancel }: {
  courseId: string;
  course: Course;
  onCancel: () => void;
}) => {
  const [values, setValues] = useState(course);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const errors = validateCourse(values);
  const canSubmit = saveStatus !== 'saving'
    && !Object.values(errors).some(Boolean)
    && courseFields.some(({ name }) => values[name] !== course[name]);

  const changeValue = (name: keyof Course, value: string) => {
    setValues(current => ({ ...current, [name]: value }));
    setSaveStatus('idle');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaveStatus('saving');
    try {
      await updateData(`/courses/${courseId}`, values);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <main className="course-page course-editor">
      <header className="page-heading">
        <h1 id="course-editor-title">Edit {course.term} CS {course.number}</h1>
        <p className="course-editor-note" id="course-editor-note">
          Review the course details, then submit to save your changes.
        </p>
      </header>
      <form className="course-form" aria-labelledby="course-editor-title"
        aria-describedby="course-editor-note" onSubmit={submit}>
        {courseFields.map(field => (
          <CourseField key={field.name} {...field} value={values[field.name]}
            error={errors[field.name]} onChange={changeValue} />
        ))}
        <div className="course-form-actions">
          <p className="save-status" role="status" data-status={saveStatus}>
            {saveMessages[saveStatus]}
          </p>
          <button type="button" className="action-button" data-variant="secondary"
            onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="action-button" disabled={!canSubmit}>
            Submit
          </button>
        </div>
      </form>
    </main>
  );
};

const CoursePlan = ({ courses }: { courses: [string, Course][] }) => {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className="action-button"
        onClick={() => dialog.current?.showModal()}>
        Course plan ({courses.length})
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

const AuthControls = ({ user, isAdmin }: { user: User | null; isAdmin: boolean }) => {
  const [error, setError] = useState('');

  const run = (action: () => Promise<void>) => {
    setError('');
    action().catch(() => setError('Could not complete sign in. Please try again.'));
  };

  return (
    <div className="auth-controls">
      {user && (
        <>
          <span className="auth-user">{user.displayName ?? user.email}</span>
          <span className="auth-role" data-role={isAdmin ? 'admin' : 'viewer'}>
            {isAdmin ? 'Administrator' : 'View only'}
          </span>
        </>
      )}
      <button type="button" className="action-button" data-variant="secondary"
        onClick={() => run(user ? signOutUser : signInWithGoogle)}>
        {user ? 'Sign out' : 'Sign in with Google'}
      </button>
      {error && <p role="alert" className="field-error auth-error">{error}</p>}
    </div>
  );
};

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
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
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
        <TermSelector selectedTerm={selectedTerm} onSelect={setSelectedTerm} />
        <div className="flex flex-wrap items-center gap-3">
          <AuthControls user={user} isAdmin={isAdmin} />
          <CoursePlan courses={plannedCourses} />
        </div>
      </div>
      <p className="course-hint">
        Select a card to add it, or click it again to remove it. Conflicting courses are marked below.
        {' '}{accessHint(user, isAdmin)}
      </p>
      <CourseList courses={visibleCourses} selectedCourses={selectedCourses}
        clashingCourseIds={clashingCourseIds} onSelect={toggleCourse}
        onEdit={isAdmin ? setEditingCourseId : undefined} />
    </main>
  );
};

const isSchedule = (data: unknown): data is Schedule =>
  typeof data === 'object' && data !== null
  && 'title' in data && typeof data.title === 'string'
  && 'courses' in data && typeof data.courses === 'object' && data.courses !== null;

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
