import { Link } from 'react-router';
import { AuthLayout } from '../features/auth/auth-layout';
import { RegisterForm } from '../features/auth/register-form';

export function RegisterPage() {
  return (
    <AuthLayout title="Criar conta">
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{' '}
        <Link
          to="/login"
          className="font-medium text-eucalyptus-700 underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
