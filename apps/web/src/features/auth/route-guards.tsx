import { Navigate, Outlet, useLocation } from 'react-router';
import { LoadingMessage } from '../../components/ui/query-state';
import { useAuth } from './auth-context';

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
