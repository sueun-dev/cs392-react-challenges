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

const firebase = initializeApp(firebaseConfig);
const database = getDatabase(firebase);

export const useDataQuery = (path: string): [unknown, boolean, Error | undefined] => {
  const [data, setData] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    return onValue(ref(database, path), snapshot => {
      setData(snapshot.val());
      setLoading(false);
    }, queryError => {
      setError(queryError);
      setLoading(false);
    });
  }, [path]);

  return [data, loading, error];
};
