import { CalendarPlus, Info } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useMyAppointments } from '../api/appointments';
import { buttonClasses } from '../components/ui/button';
import { Card } from '../components/ui/card';
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
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-ink">Meus agendamentos</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Info aria-hidden="true" className="size-4 shrink-0" />
          Você pode cancelar até 24 horas antes do horário marcado.
        </p>
      </header>
      {data.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <CalendarPlus aria-hidden="true" className="size-10 text-eucalyptus-300" />
          <p className="text-muted">Você ainda não tem agendamentos.</p>
          <Link to="/providers" className={buttonClasses('primary', 'sm')}>
            Encontre um profissional
          </Link>
        </Card>
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
