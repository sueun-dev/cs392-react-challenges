import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

type Listener = {
  onData: (snapshot: { val: () => unknown }) => void;
  onError: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
};

const database = vi.hoisted(() => ({ listeners: new Map<string, Listener>() }));

vi.mock('firebase/app', () => ({
  FirebaseError: class extends Error {},
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: class {},
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(),
  ref: (_database: unknown, path: string) => path,
  update: vi.fn(),
  onValue: (path: string, onData: Listener['onData'], onError: Listener['onError']) => {
    const unsubscribe = vi.fn();
    database.listeners.set(path, { onData, onError, unsubscribe });
    return unsubscribe;
  },
}));

const { useDataQuery, useIsAdmin } = await import('./firebase');

const send = (path: string, value: unknown) =>
  act(() => database.listeners.get(path)!.onData({ val: () => value }));

const admin = { uid: 'admin-1' } as User;
const member = { uid: 'member-1' } as User;

describe('useDataQuery', () => {
  beforeEach(() => database.listeners.clear());

  it('is loading until the first value for the path arrives', () => {
    const { result } = renderHook(() => useDataQuery('/courses'));
    expect(result.current).toEqual([undefined, true, undefined]);
    send('/courses', { a: 1 });
    expect(result.current).toEqual([{ a: 1 }, false, undefined]);
  });

  it('reports an error for the current path', () => {
    const { result } = renderHook(() => useDataQuery('/courses'));
    const error = new Error('denied');
    act(() => database.listeners.get('/courses')!.onError(error));
    expect(result.current).toEqual([undefined, false, error]);
  });

  it('does not return the previous path data after the path changes', () => {
    const { result, rerender } = renderHook(({ path }) => useDataQuery(path), {
      initialProps: { path: '/first' },
    });
    send('/first', 'one');
    expect(result.current[0]).toBe('one');

    rerender({ path: '/second' });
    expect(result.current).toEqual([undefined, true, undefined]);
    expect(database.listeners.get('/first')!.unsubscribe).toHaveBeenCalled();

    send('/second', 'two');
    expect(result.current).toEqual(['two', false, undefined]);
  });
});

describe('useIsAdmin', () => {
  beforeEach(() => database.listeners.clear());

  it('reads the admin flag for the signed-in user', () => {
    const { result } = renderHook(() => useIsAdmin(admin));
    expect(result.current).toEqual([false, true]);
    send('/admins/admin-1', true);
    expect(result.current).toEqual([true, false]);
  });

  it('is not an admin when the user has no entry under admins', () => {
    const { result } = renderHook(() => useIsAdmin(member));
    send('/admins/member-1', null);
    expect(result.current).toEqual([false, false]);
  });

  it('never treats a signed-out visitor as an admin', () => {
    const { result } = renderHook(() => useIsAdmin(null));
    send('/admins/guest', true);
    expect(result.current).toEqual([false, false]);
  });

  it('drops admin rights immediately when the user signs out', () => {
    const { result, rerender } = renderHook(({ user }) => useIsAdmin(user), {
      initialProps: { user: admin as User | null },
    });
    send('/admins/admin-1', true);
    expect(result.current).toEqual([true, false]);

    rerender({ user: null });
    expect(result.current[0]).toBe(false);
  });
});
