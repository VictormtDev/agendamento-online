import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useProviderAgenda, type ProviderAppointment } from '../api/appointments';
import { Button } from '../components/ui/button';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';
import { CancelAppointmentButton } from '../features/appointments/cancel-appointment-button';
import { STATUS_LABELS } from '../features/appointments/status-labels';
import { useSignedInUser } from '../features/auth/auth-context';
import {
  agendaRange,
  calendarDateOf,
  shiftDate,
  startOfCalendarDate,
  type AgendaView,
} from '../lib/agenda-range';
import { formatDayLabel, formatTime, todayIn } from '../lib/format';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

// View and date live in the URL, so a reload or a shared link opens the same agenda.
function useAgendaParams(timezone: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: AgendaView = searchParams.get('view') === 'week' ? 'week' : 'day';
  const requested = searchParams.get('date') ?? '';
  const date = DATE_PATTERN.test(requested) ? requested : todayIn(timezone);
  const update = (next: { view?: AgendaView; date?: string }) => {
    setSearchParams({ view: next.view ?? view, date: next.date ?? date });
  };
  return { view, date, update };
}

export function ProviderAgendaPage() {
  const { timezone } = useSignedInUser();
  const { view, date, update } = useAgendaParams(timezone);
  const range = agendaRange(view, date, timezone);
  const agenda = useProviderAgenda(range.from, range.to);
  // Read once per visit, so every item judges "already started" against the same instant.
  const [now] = useState(() => new Date());

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Agenda</h1>
        <div className="flex items-center gap-2" role="group" aria-label="Visualização">
          {(['day', 'week'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => {
                update({ view: option });
              }}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm aria-pressed:bg-slate-900 aria-pressed:text-white"
            >
              {option === 'day' ? 'Dia' : 'Semana'}
            </button>
          ))}
        </div>
      </div>

      <nav aria-label="Navegar na agenda" className="flex items-center gap-2">
        <Button
          onClick={() => {
            update({ date: shiftDate(view, date, timezone, -1) });
          }}
        >
          {view === 'day' ? 'Dia anterior' : 'Semana anterior'}
        </Button>
        <Button
          onClick={() => {
            update({ date: todayIn(timezone) });
          }}
        >
          Hoje
        </Button>
        <Button
          onClick={() => {
            update({ date: shiftDate(view, date, timezone, 1) });
          }}
        >
          {view === 'day' ? 'Próximo dia' : 'Próxima semana'}
        </Button>
      </nav>
      <p className="text-sm text-slate-600">Horários no fuso {timezone}.</p>

      {agenda.isPending && <LoadingMessage />}
      {agenda.isError && <ErrorMessage error={agenda.error} />}
      {agenda.isSuccess &&
        range.days.map((day) => (
          <AgendaDay
            key={day}
            label={formatDayLabel(startOfCalendarDate(day, timezone), timezone)}
            appointments={agenda.data.filter(
              (item) => calendarDateOf(item.startsAt, timezone) === day,
            )}
            timezone={timezone}
            now={now}
          />
        ))}
    </section>
  );
}

interface AgendaDayProps {
  label: string;
  appointments: ProviderAppointment[];
  timezone: string;
  now: Date;
}

function AgendaDay({ label, appointments, timezone, now }: AgendaDayProps) {
  return (
    <section aria-label={label} className="flex flex-col gap-2">
      <h2 className="font-medium capitalize text-slate-900">{label}</h2>
      {appointments.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum agendamento.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-slate-900">
                  {formatTime(appointment.startsAt, timezone)}–
                  {formatTime(appointment.endsAt, timezone)} · {appointment.service.name}
                </span>
                <span className="text-sm text-slate-700">{STATUS_LABELS[appointment.status]}</span>
              </div>
              <span className="text-sm text-slate-600">{appointment.client.name}</span>
              {/* The provider may cancel at any time before the start. */}
              {appointment.status === 'SCHEDULED' && new Date(appointment.startsAt) > now && (
                <CancelAppointmentButton appointmentId={appointment.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
