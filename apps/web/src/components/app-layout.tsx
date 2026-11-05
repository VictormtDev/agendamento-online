import { Link, Outlet } from 'react-router';
import { useAuth } from '../features/auth/auth-context';
import { Button } from './ui/button';

export function AppLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
          <Link to="/providers" className="font-semibold text-slate-900">
            Plataforma de Agendamento
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Olá, {user?.name}</span>
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
