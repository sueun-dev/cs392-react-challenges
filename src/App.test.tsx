import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import App from './App';

const firebase = vi.hoisted(() => ({
  user: null as User | null | undefined,
  isAdmin: false,
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  updateData: vi.fn(),
}));

vi.mock('./utilities/firebase', () => ({
  signInWithGoogle: firebase.signInWithGoogle,
  signOutUser: firebase.signOutUser,
  updateData: firebase.updateData,
  useAuthState: () => firebase.user,
  useIsAdmin: () => [firebase.isAdmin, false],
  useDataQuery: () => [{
    title: 'CS Courses',
    courses: {
      f101: { term: 'Fall', number: '101', meets: 'MWF 11:00-11:50', title: 'Intro to Computing' },
      f102: { term: 'Fall', number: '102', meets: 'MW 11:30-12:20', title: 'Programming' },
      f103: { term: 'Fall', number: '103', meets: 'TuTh 9:00-10:20', title: 'Data' },
      w110: { term: 'Winter', number: '110', meets: 'MWF 11:00-11:50', title: 'Systems' },
    },
  }, false, undefined],
}));

const signedInUser = { displayName: 'Sueun Cho', email: 'sueun@example.com' } as User;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebase.user = null;
    firebase.isAdmin = false;
    firebase.signInWithGoogle.mockResolvedValue(undefined);
    firebase.signOutUser.mockResolvedValue(undefined);
    firebase.updateData.mockResolvedValue(undefined);
  });

  it('shows a loading message until the sign-in state is known', () => {
    firebase.user = undefined;
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading courses...');
  });

  it('offers sign in, hides Edit buttons and tells signed-out visitors who can edit', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Administrators can sign in to edit courses/)).toBeInTheDocument();
  });

  it('starts Google sign in from the button', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(firebase.signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('shows a message when sign in fails', async () => {
    firebase.signInWithGoogle.mockRejectedValue(new Error('blocked'));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not complete sign in');
  });

  it('shows the user name, Sign out, and no Edit buttons to a signed-in user who is not an admin', () => {
    firebase.user = signedInUser;
    render(<App />);
    expect(screen.getByText('Sueun Cho')).toBeInTheDocument();
    expect(screen.getByText('View only')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Only administrators can edit courses/)).toBeInTheDocument();
  });

  it('shows the user name, Sign out, and Edit buttons to an admin', () => {
    firebase.user = signedInUser;
    firebase.isAdmin = true;
    render(<App />);
    expect(screen.getByText('Sueun Cho')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Fall CS 101' })).toBeInTheDocument();
    expect(screen.queryByText(/only administrators can edit/i)).not.toBeInTheDocument();
  });

  it('closes the editor when the user stops being an admin and does not reopen it later', () => {
    firebase.user = signedInUser;
    firebase.isAdmin = true;
    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Fall CS 101' }));
    expect(screen.getByRole('heading', { name: 'Edit Fall CS 101' })).toBeInTheDocument();

    firebase.isAdmin = false;
    rerender(<App />);
    expect(screen.queryByRole('heading', { name: 'Edit Fall CS 101' })).not.toBeInTheDocument();

    firebase.isAdmin = true;
    rerender(<App />);
    expect(screen.queryByRole('heading', { name: 'Edit Fall CS 101' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Fall CS 101' })).toBeInTheDocument();
  });

  it('signs out from the button', () => {
    firebase.user = signedInUser;
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(firebase.signOutUser).toHaveBeenCalledTimes(1);
  });

  it('saves an edited course and reports it', async () => {
    firebase.user = signedInUser;
    firebase.isAdmin = true;
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Fall CS 101' }));
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Intro to Programming' } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saved.'));
    expect(firebase.updateData).toHaveBeenCalledWith('/courses/f101', {
      term: 'Fall', number: '101', meets: 'MWF 11:00-11:50', title: 'Intro to Programming',
    });
  });

  it('reports a failed save and clears the message after the next edit', async () => {
    firebase.user = signedInUser;
    firebase.isAdmin = true;
    firebase.updateData.mockRejectedValue(new Error('Permission denied'));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Fall CS 101' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Intro to Programming' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Could not save'));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Intro to Coding' } });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('does not open the editor for a signed-out user', () => {
    render(<App />);
    expect(screen.queryByRole('heading', { name: /^Edit Fall CS 101$/ })).not.toBeInTheDocument();
    expect(firebase.updateData).not.toHaveBeenCalled();
  });

  it('switches the course plan between a list and a weekly calendar', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 101/ }));
    expect(screen.getByRole('button', { name: 'List', hidden: true, pressed: true })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Monday', hidden: true })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Calendar', hidden: true }));
    expect(screen.getByRole('button', { name: 'Calendar', hidden: true, pressed: true })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Monday', hidden: true })).getByText('101')).toBeInTheDocument();
  });

  it('marks a course that overlaps a selected one and frees it again when the selection is removed', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 101/ }));
    expect(screen.getByRole('button', { name: /Fall CS 102/ })).toBeDisabled();
    expect(screen.getByText('Time conflict')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fall CS 103/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Course plan (1)' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Fall CS 101/ }));
    expect(screen.getByRole('button', { name: /Fall CS 102/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Course plan (0)' })).toBeInTheDocument();
  });

  it('keeps the selection when another term is shown and clashes stay within a term', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 101/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Winter' }));
    expect(screen.getByRole('button', { name: /Winter CS 110/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Course plan (1)' })).toBeInTheDocument();
  });

  it('filters the visible courses by the search text and offers a way back', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Search courses'), { target: { value: 'program' } });
    expect(screen.getByRole('button', { name: /Fall CS 102/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Fall CS 101/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search courses'), { target: { value: 'zzz' } });
    expect(screen.getByText('No courses match your search.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('button', { name: /Fall CS 101/ })).toBeInTheDocument();
    expect(screen.queryByText('No courses match your search.')).not.toBeInTheDocument();
  });

  it('keeps a selected course and its clash marks while it is filtered out', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 101/ }));
    fireEvent.change(screen.getByLabelText('Search courses'), { target: { value: 'program' } });
    expect(screen.getByRole('button', { name: /Fall CS 102/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Course plan (1)' })).toBeInTheDocument();
  });

  it('finds courses despite typing mistakes and lists the best match first', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Search courses'), { target: { value: 'progrmaing' } });
    expect(screen.getByRole('button', { name: /Fall CS 102/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Fall CS 101/ })).not.toBeInTheDocument();
    expect(screen.getByText('1 of 3 courses match')).toBeInTheDocument();
  });

  it('finds courses by the day they meet', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Search courses'), { target: { value: 'tuesday' } });
    expect(screen.getByRole('button', { name: /Fall CS 103/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Fall CS 101/ })).not.toBeInTheDocument();
  });
});
