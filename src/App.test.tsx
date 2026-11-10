import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    },
  }, false, undefined],
}));

const signedInUser = { displayName: 'Sueun Cho', email: 'sueun@example.com' } as User;

describe('authentication', () => {
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
});
