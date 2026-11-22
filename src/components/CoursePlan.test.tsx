import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Course } from '../schedule';
import CoursePlan from './CoursePlan';

const intro: Course = { term: 'Fall', number: '101', meets: 'MWF 11:00-11:50', title: 'Intro to Computing' };
const systems: Course = { term: 'Fall', number: '213', meets: 'TuTh 3:30-4:50', title: 'Intro to systems' };
const planned: [string, Course][] = [['f101', intro], ['f213', systems]];

const renderPlan = (courses = planned, notes: Record<string, string> = {}) => {
  const onNoteChange = vi.fn();
  render(<CoursePlan courses={courses} notes={notes} onNoteChange={onNoteChange} />);
  return onNoteChange;
};

describe('CoursePlan notes', () => {
  it('shows an empty message and no note boxes when nothing is planned', () => {
    renderPlan([]);
    expect(screen.getByText(/No courses selected/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { hidden: true })).not.toBeInTheDocument();
  });

  it('shows one note box per planned course with its saved text', () => {
    renderPlan(planned, { f101: 'Ask about the project' });
    expect(screen.getByLabelText('Note for Fall CS 101')).toHaveValue('Ask about the project');
    expect(screen.getByLabelText('Note for Fall CS 213')).toHaveValue('');
  });

  it('limits the note length in the text box', () => {
    renderPlan();
    expect(screen.getByLabelText('Note for Fall CS 101')).toHaveAttribute('maxlength', '280');
  });

  it('reports the course id and the new text when a note is typed', () => {
    const onNoteChange = renderPlan();
    fireEvent.change(screen.getByLabelText('Note for Fall CS 213'), { target: { value: 'Hard' } });
    expect(onNoteChange).toHaveBeenCalledTimes(1);
    expect(onNoteChange).toHaveBeenCalledWith('f213', 'Hard');
  });

  it('shows the notes again after switching between the calendar and the list', () => {
    renderPlan(planned, { f101: 'Keep me' });
    fireEvent.click(screen.getByRole('button', { name: 'Calendar', hidden: true }));
    expect(screen.queryByLabelText('Note for Fall CS 101')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'List', hidden: true }));
    expect(screen.getByLabelText('Note for Fall CS 101')).toHaveValue('Keep me');
  });

  it('counts the planned courses on the button', () => {
    renderPlan();
    expect(screen.getByRole('button', { name: 'Course plan (2)' })).toBeInTheDocument();
  });
});
