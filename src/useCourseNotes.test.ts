import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCourseNotes } from './useCourseNotes';

const course = (number: string) => ({ term: 'Fall', number, meets: 'MWF 11:00-11:50', title: 'Course' });
const courses = { f101: course('101'), f102: course('102') };
const saved = () => JSON.parse(localStorage.getItem('course-notes') ?? 'null');

describe('useCourseNotes', () => {
  beforeEach(() => localStorage.clear());

  it('starts with no notes', () => {
    const { result } = renderHook(() => useCourseNotes(courses));
    expect(result.current.notes).toEqual({});
  });

  it('starts from the saved notes of courses that still exist', () => {
    localStorage.setItem('course-notes', JSON.stringify({ f101: 'keep', gone: 'drop' }));
    const { result } = renderHook(() => useCourseNotes(courses));
    expect(result.current.notes).toEqual({ f101: 'keep' });
    expect(saved()).toEqual({ f101: 'keep' });
  });

  it('adds, changes and clears a note and saves each step', () => {
    const { result } = renderHook(() => useCourseNotes(courses));

    act(() => result.current.changeNote('f101', 'first'));
    expect(result.current.notes).toEqual({ f101: 'first' });
    expect(saved()).toEqual({ f101: 'first' });

    act(() => result.current.changeNote('f101', 'changed'));
    expect(saved()).toEqual({ f101: 'changed' });

    act(() => result.current.changeNote('f101', ''));
    expect(result.current.notes).toEqual({});
    expect(saved()).toEqual({});
  });

  it('keeps the notes of other courses when one changes', () => {
    const { result } = renderHook(() => useCourseNotes(courses));
    act(() => result.current.changeNote('f101', 'one'));
    act(() => result.current.changeNote('f102', 'two'));
    act(() => result.current.changeNote('f101', ''));
    expect(result.current.notes).toEqual({ f102: 'two' });
  });

  it('applies several changes made in the same update', () => {
    const { result } = renderHook(() => useCourseNotes(courses));
    act(() => {
      result.current.changeNote('f101', 'one');
      result.current.changeNote('f102', 'two');
    });
    expect(result.current.notes).toEqual({ f101: 'one', f102: 'two' });
  });
});
