import type { ComponentProps } from 'react';

export function Button({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={`rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
