import { Link } from 'react-router';
import { AuthLayout } from '../features/auth/auth-layout';
import { RegisterForm } from '../features/auth/register-form';

export function RegisterPage() {
  return (
    <AuthLayout title="Criar conta">
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-slate-900 underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
