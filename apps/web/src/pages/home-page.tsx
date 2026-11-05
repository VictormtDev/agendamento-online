import { Button } from '../components/ui/button';
import { useAuth } from '../features/auth/auth-context';

export function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <h1 className="text-3xl font-semibold text-slate-900">Olá, {user?.name}</h1>
      <Button onClick={signOut}>Sair</Button>
    </main>
  );
}
