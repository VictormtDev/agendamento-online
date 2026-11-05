import { Link } from 'react-router';
import { AuthLayout } from '../features/auth/auth-layout';
import { LoginForm } from '../features/auth/login-form';

export function LoginPage() {
  return (
    <AuthLayout title="Entrar">
      <LoginForm />
      <p className="mt-4 text-center text-sm text-slate-600">
        Ainda não tem conta?{' '}
        <Link to="/register" className="font-medium text-slate-900 underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
