import { Link } from 'react-router';
import { AuthLayout } from '../features/auth/auth-layout';
import { LoginForm } from '../features/auth/login-form';

export function LoginPage() {
  return (
    <AuthLayout title="Entrar">
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted">
        Ainda não tem conta?{' '}
        <Link
          to="/register"
          className="font-medium text-eucalyptus-700 underline-offset-4 hover:underline"
        >
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
