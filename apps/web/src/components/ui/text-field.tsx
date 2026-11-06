import { useId, type ComponentProps } from 'react';

// Padding lives only in the exported variants: overriding a utility through className
// is not reliable in Tailwind, as CSS order, not class order, decides which one wins.
const INPUT_BASE =
  'rounded-xl border border-line bg-white text-ink transition-colors focus:border-eucalyptus-600 focus:ring-2 focus:ring-eucalyptus-100 focus:outline-none aria-invalid:border-ruby-600';

/** Shared with inputs that have no visible label (e.g. the service duration select). */
export const INPUT_CLASSES = `${INPUT_BASE} px-3.5 py-2.5`;

/** For inline inputs in dense rows, like the weekly grid times. */
export const COMPACT_INPUT_CLASSES = `${INPUT_BASE} px-3 py-1.5`;

interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  error?: string | undefined;
}

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={INPUT_CLASSES}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-ruby-700">
          {error}
        </p>
      )}
    </div>
  );
}
