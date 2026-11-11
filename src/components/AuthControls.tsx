import { useState } from 'react';
import type { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '../utilities/firebase';

const AuthControls = ({ user, isAdmin }: { user: User | null; isAdmin: boolean }) => {
  const [error, setError] = useState('');

  const run = (action: () => Promise<void>) => {
    setError('');
    action().catch(() => setError('Could not complete sign in. Please try again.'));
  };

  return (
    <div className="auth-controls">
      {user && (
        <>
          <span className="auth-user">{user.displayName ?? user.email}</span>
          <span className="auth-role" data-role={isAdmin ? 'admin' : 'viewer'}>
            {isAdmin ? 'Administrator' : 'View only'}
          </span>
        </>
      )}
      <button type="button" className="action-button" data-variant="secondary"
        onClick={() => run(user ? signOutUser : signInWithGoogle)}>
        {user ? 'Sign out' : 'Sign in with Google'}
      </button>
      {error && <p role="alert" className="field-error auth-error">{error}</p>}
    </div>
  );
};

export default AuthControls;
