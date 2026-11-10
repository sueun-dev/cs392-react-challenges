import { useEffect, useState } from 'react';
import { FirebaseError, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { getDatabase, onValue, ref, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAwgyGuQuQ3QKlLMc0p6C2-63_wo56KE1o',
  authDomain: 'cs392-react-challenges-3d0d7.firebaseapp.com',
  databaseURL: 'https://cs392-react-challenges-3d0d7-default-rtdb.firebaseio.com',
  projectId: 'cs392-react-challenges-3d0d7',
  storageBucket: 'cs392-react-challenges-3d0d7.firebasestorage.app',
  messagingSenderId: '523620722107',
  appId: '1:523620722107:web:8d9d236d5062a65096509e',
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

const dismissedSignInCodes = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (error) {
    if (error instanceof FirebaseError && dismissedSignInCodes.includes(error.code)) return;
    throw error;
  }
};

export const signOutUser = () => signOut(auth);

export const useAuthState = () => {
  const [user, setUser] = useState<User | null | undefined>();

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return user;
};

type DataQuery = [data: unknown, isLoading: boolean, error: Error | undefined];

type QueryResult = { path: string; data?: unknown; error?: Error };

export const useDataQuery = (path: string): DataQuery => {
  const [result, setResult] = useState<QueryResult>();

  useEffect(() => onValue(ref(database, path),
    snapshot => setResult({ path, data: snapshot.val() }),
    queryError => setResult({ path, error: queryError })
  ), [path]);

  const isCurrent = result?.path === path;
  return [isCurrent ? result.data : undefined, !isCurrent, isCurrent ? result.error : undefined];
};

export const useIsAdmin = (user: User | null | undefined): [isAdmin: boolean, isLoading: boolean] => {
  const [adminFlag, isLoading] = useDataQuery(`/admins/${user?.uid ?? 'guest'}`);
  return [user != null && adminFlag === true, isLoading];
};

export const updateData = (path: string, value: object) => update(ref(database, path), value);
