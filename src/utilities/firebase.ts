import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAwgyGuQuQ3QKlLMc0p6C2-63_wo56KE1o',
  authDomain: 'cs392-react-challenges-3d0d7.firebaseapp.com',
  databaseURL: 'https://cs392-react-challenges-3d0d7-default-rtdb.firebaseio.com',
  projectId: 'cs392-react-challenges-3d0d7',
  storageBucket: 'cs392-react-challenges-3d0d7.firebasestorage.app',
  messagingSenderId: '523620722107',
  appId: '1:523620722107:web:8d9d236d5062a65096509e',
};

const database = getDatabase(initializeApp(firebaseConfig));

type DataQuery = [data: unknown, isLoading: boolean, error: Error | undefined];

export const useDataQuery = (path: string): DataQuery => {
  const [data, setData] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => onValue(ref(database, path),
    snapshot => {
      setData(snapshot.val());
      setIsLoading(false);
    },
    queryError => {
      setError(queryError);
      setIsLoading(false);
    }
  ), [path]);

  return [data, isLoading, error];
};
