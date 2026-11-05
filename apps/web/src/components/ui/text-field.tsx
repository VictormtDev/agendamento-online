import { useId, type ComponentProps } from 'react';

interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  error?: string | undefined;
}

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none aria-invalid:border-red-500"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
