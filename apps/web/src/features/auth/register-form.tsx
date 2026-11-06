import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarHeart, Scissors } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRegister } from '../../api/auth';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { useAuth } from './auth-context';
import { registerSchema, type RegisterFormValues } from './auth-schemas';

const ROLE_OPTIONS = [
  { value: 'CLIENT', label: 'Quero agendar serviços', icon: CalendarHeart },
  { value: 'PROVIDER', label: 'Sou profissional e ofereço serviços', icon: Scissors },
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
        <legend className="mb-1.5 text-sm font-medium text-ink">Tipo de conta</legend>
        {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 text-sm transition-colors has-checked:border-eucalyptus-600 has-checked:bg-eucalyptus-50"
          >
            <input
              type="radio"
              value={value}
              className="accent-eucalyptus-700"
              {...register('role')}
            />
            <Icon aria-hidden="true" className="size-5 shrink-0 text-eucalyptus-700" />
            {label}
          </label>
        ))}
      </fieldset>
      {registerUser.error && (
        <p role="alert" className="text-sm text-ruby-700">
          {registerUser.error.message}
        </p>
      )}
      <Button type="submit" className="mt-2 w-full" disabled={registerUser.isPending}>
        {registerUser.isPending ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  );
}
