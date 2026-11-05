import type { ReactNode } from 'react';

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-4">
      <h1 className="text-3xl font-semibold text-slate-900">Plataforma de Agendamento</h1>
      <section className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">{title}</h2>
        {children}
      </section>
    </main>
  );
}
