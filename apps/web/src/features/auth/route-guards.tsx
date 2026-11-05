import { Navigate, Outlet, useLocation } from 'react-router';
import { LoadingMessage } from '../../components/ui/query-state';
import { useAuth, useSignedInUser } from './auth-context';

interface RedirectState {
  from?: string;
}

/** Sends visitors to the login page, remembering where they wanted to go. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingMessage />;
  }
  if (status === 'anonymous') {
    const state: RedirectState = { from: location.pathname };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}

/**
 * Keeps signed-in users out of the login and register pages. It is also what moves
 * the user on after signing in: the pages only update the session.
 */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingMessage />;
  }
  if (status === 'authenticated') {
    const state = location.state as RedirectState | null;
    return <Navigate to={state?.from ?? '/'} replace />;
  }
  return <Outlet />;
}

/** Each role lands on its own home: providers on their agenda, clients on the providers. */
export function HomeRedirect() {
  const user = useSignedInUser();
  return <Navigate to={user.role === 'PROVIDER' ? '/dashboard' : '/providers'} replace />;
}

/** The provider area; the API refuses clients anyway, this only keeps them off broken pages. */
export function RequireProvider() {
  const user = useSignedInUser();
  if (user.role !== 'PROVIDER') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
