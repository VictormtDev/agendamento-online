import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './auth-context';

interface RedirectState {
  from?: string;
}

function LoadingSession() {
  return (
    <p role="status" className="p-8 text-center text-slate-600">
      Carregando...
    </p>
  );
}

/** Sends visitors to the login page, remembering where they wanted to go. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingSession />;
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
    return <LoadingSession />;
  }
  if (status === 'authenticated') {
    const state = location.state as RedirectState | null;
    return <Navigate to={state?.from ?? '/'} replace />;
  }
  return <Outlet />;
}
