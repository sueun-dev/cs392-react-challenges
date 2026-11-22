import { useEffect, useState } from 'react';
import { keepExistingNotes, loadNotes, saveNotes, withNote } from './courseNotes';
import type { Course } from './schedule';

export const useCourseNotes = (courses: Record<string, Course>) => {
  const [notes, setNotes] = useState(() => keepExistingNotes(loadNotes(), courses));

  useEffect(() => saveNotes(notes), [notes]);

  const changeNote = (courseId: string, text: string) =>
    setNotes(current => withNote(current, courseId, text));

  return { notes, changeNote };
};
