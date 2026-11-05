import { useState } from 'react';
import { Link } from 'react-router';
import { useMyAppointments } from '../api/appointments';
import { Pagination, usePageParam } from '../components/ui/pagination';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';
import { AppointmentCard } from '../features/appointments/appointment-card';

export function MyAppointmentsPage() {
  const [page, setPage] = usePageParam();
  const appointments = useMyAppointments(page);
  // Read once per visit, so every card judges "already started" against the same instant.
  const [now] = useState(() => new Date());

  if (appointments.isPending) {
    return <LoadingMessage />;
  }
  if (appointments.isError) {
    return <ErrorMessage error={appointments.error} />;
  }

  const { data, meta } = appointments.data;
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.perPage));

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Meus agendamentos</h1>
      <p className="text-sm text-slate-600">
        Você pode cancelar até 24 horas antes do horário marcado.
      </p>
      {data.length === 0 ? (
        <p className="text-slate-600">
          Você ainda não tem agendamentos.{' '}
          <Link to="/providers" className="font-medium text-slate-900 underline">
            Encontre um profissional
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} now={now} />
          ))}
        </ul>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}
