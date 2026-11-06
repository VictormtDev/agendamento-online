import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ServiceInput } from '../../api/services';
import { Button } from '../../components/ui/button';
import { CARD_CLASSES } from '../../components/ui/card';
import { INPUT_CLASSES, TextField } from '../../components/ui/text-field';
import { formatDuration } from '../../lib/format';

// Mirrors the API rules: a multiple of the 15-minute slot, up to 8 hours.
const SLOT_MINUTES = 15;
const MAX_DURATION_MINUTES = 480;
const MAX_PRICE_REAIS = 100_000;
const CENTS_PER_REAL = 100;

// Offering only valid durations is friendlier than validating a free number.
const DURATION_OPTIONS = Array.from(
  { length: MAX_DURATION_MINUTES / SLOT_MINUTES },
  (_, index) => (index + 1) * SLOT_MINUTES,
);

const serviceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Informe o nome do serviço' })
    .max(100, { error: 'Use no máximo 100 caracteres' }),
  durationMinutes: z.number(),
  price: z
    .number({ error: 'Informe o preço' })
    .min(0, { error: 'O preço não pode ser negativo' })
    .max(MAX_PRICE_REAIS, { error: 'O preço máximo é R$ 100.000,00' })
    .multipleOf(0.01, { error: 'Use no máximo dois decimais' }),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  initial?: ServiceInput;
  submitLabel: string;
  isPending: boolean;
  error: Error | null;
  onSubmit: (input: ServiceInput) => void;
  onCancel?: () => void;
}

export function ServiceForm({
  initial,
  submitLabel,
  isPending,
  error,
  onSubmit,
  onCancel,
}: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      durationMinutes: initial?.durationMinutes ?? 60,
      ...(initial && { price: initial.priceCents / CENTS_PER_REAL }),
    },
  });

  const submit = handleSubmit(({ name, durationMinutes, price }) => {
    // The form speaks reais, the API cents; rounding absorbs float noise (45.5 * 100).
    onSubmit({ name, durationMinutes, priceCents: Math.round(price * CENTS_PER_REAL) });
  });

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      className={`${CARD_CLASSES} flex flex-col gap-4 p-5`}
    >
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <TextField label="Nome" error={errors.name?.message} {...register('name')} />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Duração
          <select
            className={`${INPUT_CLASSES} font-normal`}
            {...register('durationMinutes', { valueAsNumber: true })}
          >
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Preço (R$)"
          type="number"
          step="0.01"
          min="0"
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-ruby-700">
          {error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
