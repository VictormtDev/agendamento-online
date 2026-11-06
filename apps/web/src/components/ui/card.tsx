import type { ComponentProps } from 'react';

/** For lists, sections and forms that must keep their own element (and semantics). */
export const CARD_CLASSES = 'rounded-2xl border border-line bg-white';

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`${CARD_CLASSES} ${className}`} {...props} />;
}
