import { z } from 'zod';

// Mirrors the API rules so the user gets instant feedback; the API still validates.
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MAX_NAME_LENGTH = 100;

const emailSchema = z.email({ error: 'Informe um e-mail válido' });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'Informe sua senha' }),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Informe seu nome' })
    .max(MAX_NAME_LENGTH, { error: `Use no máximo ${String(MAX_NAME_LENGTH)} caracteres` }),
  email: emailSchema,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, {
      error: `A senha precisa de pelo menos ${String(MIN_PASSWORD_LENGTH)} caracteres`,
    })
    .max(MAX_PASSWORD_LENGTH, {
      error: `A senha pode ter no máximo ${String(MAX_PASSWORD_LENGTH)} caracteres`,
    }),
  role: z.enum(['CLIENT', 'PROVIDER']),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
