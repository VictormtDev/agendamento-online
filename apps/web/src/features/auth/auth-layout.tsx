import type { ReactNode } from 'react';
import { CARD_CLASSES } from '../../components/ui/card';
import { Logo } from '../../components/ui/logo';

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-eucalyptus-800 p-12 text-white lg:flex">
        <Logo tone="light" />
        <div className="flex max-w-md flex-col gap-4">
          <h1 className="text-5xl leading-[1.05] font-bold">Seu horário, no encaixe certo.</h1>
          <p className="text-lg text-eucalyptus-100">
            Salões, clínicas e barbearias com agenda aberta para você.
          </p>
        </div>
        {/* Echoes the slot pills of the booking flow, so the brand panel previews the product. */}
        <ul aria-hidden="true" className="flex flex-wrap gap-2">
          {['09:00', '09:15', '10:30', '14:00', '16:45'].map((time) => (
            <li
              key={time}
              className={`rounded-full px-4 py-1.5 text-sm tabular-nums ${
                time === '10:30'
                  ? 'bg-saffron-400 font-medium text-eucalyptus-900'
                  : 'border border-eucalyptus-600 text-eucalyptus-100'
              }`}
            >
              {time}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-col items-center justify-center gap-8 p-4 py-12">
        <Logo className="lg:hidden" />
        <section className={`${CARD_CLASSES} w-full max-w-sm p-6 sm:p-8`}>
          <h2 className="mb-6 text-2xl font-bold text-ink">{title}</h2>
          {children}
        </section>
      </main>
    </div>
  );
}
