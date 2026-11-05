import { Link, NavLink, Outlet } from 'react-router';
import { useAuth, useSignedInUser } from '../features/auth/auth-context';
import { Button } from './ui/button';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'text-sm font-medium text-slate-900 underline' : 'text-sm text-slate-600';
}

export function AppLayout() {
  const { signOut } = useAuth();
  const user = useSignedInUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
          <nav className="flex items-center gap-4">
            <Link to="/providers" className="font-semibold text-slate-900">
              Plataforma de Agendamento
            </Link>
            {user.role === 'PROVIDER' && (
              <NavLink to="/dashboard" className={navLinkClass}>
                Agenda
              </NavLink>
            )}
            <NavLink to="/providers" className={navLinkClass}>
              Profissionais
            </NavLink>
            <NavLink to="/appointments" className={navLinkClass}>
              Meus agendamentos
            </NavLink>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Olá, {user.name}</span>
            <Button onClick={signOut}>Sair</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
