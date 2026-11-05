import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLogin } from '../../api/auth';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { useAuth } from './auth-context';
import { loginSchema, type LoginFormValues } from './auth-schemas';

export function LoginForm() {
  const { signIn } = useAuth();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: signIn });
  });

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {login.error && (
        <p role="alert" className="text-sm text-red-600">
          {login.error.message}
        </p>
      )}
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
