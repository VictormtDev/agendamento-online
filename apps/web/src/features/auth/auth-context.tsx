import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { meQueryKey, useMe, type AuthResponse, type User } from '../../api/auth';
import { ApiError } from '../../api/http-client';
import { tokenStorage } from '../../api/token-storage';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: User | undefined;
  signIn: (response: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(tokenStorage.get);
  const me = useMe(token !== null);

  // An expired or revoked token surfaces as a 401 on /me; dropping it sends the
  // user back to the login page instead of leaving a half-broken session.
  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) {
      tokenStorage.clear();
      setToken(null);
    }
  }, [me.error]);

  const signIn = (response: AuthResponse) => {
    tokenStorage.set(response.accessToken);
    // Login already returns the profile, so the cache is filled instead of asking /me again.
    queryClient.setQueryData(meQueryKey, response.user);
    setToken(response.accessToken);
  };

  const signOut = () => {
    tokenStorage.clear();
    queryClient.clear();
    setToken(null);
  };

  const user = token === null ? undefined : me.data;
  const status = toStatus(user, token !== null && me.isPending);

  return (
    <AuthContext.Provider value={{ status, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Any failure other than the 401 handled above (e.g. the API is down) counts as
// anonymous: the user can sign in again, which replaces the stored token.
function toStatus(user: User | undefined, isLoadingProfile: boolean): AuthStatus {
  if (user) {
    return 'authenticated';
  }
  return isLoadingProfile ? 'loading' : 'anonymous';
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}

/** For components under RequireAuth, where a signed-in user is guaranteed. */
export function useSignedInUser(): User {
  const { user } = useAuth();
  if (!user) {
    throw new Error('useSignedInUser must be used under <RequireAuth>');
  }
  return user;
}
