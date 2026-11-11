import { useState, type FormEvent } from 'react';
import { validateCourse } from '../courseValidation';
import type { Course } from '../schedule';
import { updateData } from '../utilities/firebase';

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

type CourseFieldProps = {
  name: keyof Course;
  label: string;
  hint: string;
  value: string;
  error: string;
  onChange: (name: keyof Course, value: string) => void;
};

const CourseField = ({ name, label, hint, value, error, onChange }: CourseFieldProps) => (
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

export default CourseForm;
