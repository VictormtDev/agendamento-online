import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRegister } from '../../api/auth';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { useAuth } from './auth-context';
import { registerSchema, type RegisterFormValues } from './auth-schemas';

const ROLE_OPTIONS = [
  { value: 'CLIENT', label: 'Quero agendar serviços' },
  { value: 'PROVIDER', label: 'Sou profissional e ofereço serviços' },
] as const;

export function RegisterForm() {
  const { signIn } = useAuth();
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CLIENT' },
  });

  const onSubmit = handleSubmit((values) => {
    registerUser.mutate(values, { onSuccess: signIn });
  });

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
      <TextField
        label="Nome"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
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
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-slate-700">Tipo de conta</legend>
        {ROLE_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-slate-700">
            <input type="radio" value={option.value} {...register('role')} />
            {option.label}
          </label>
        ))}
      </fieldset>
      {registerUser.error && (
        <p role="alert" className="text-sm text-red-600">
          {registerUser.error.message}
        </p>
      )}
      <Button type="submit" disabled={registerUser.isPending}>
        {registerUser.isPending ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  );
}
