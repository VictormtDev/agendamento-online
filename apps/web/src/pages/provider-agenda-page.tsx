import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useProviderAgenda, type ProviderAppointment } from '../api/appointments';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { CARD_CLASSES } from '../components/ui/card';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';
import { StatusBadge } from '../components/ui/status-badge';
import { CancelAppointmentButton } from '../features/appointments/cancel-appointment-button';
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
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-ink">Agenda</h1>
        <div
          className="flex rounded-full border border-line bg-white p-1"
          role="group"
          aria-label="Visualização"
        >
          {(['day', 'week'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => {
                update({ view: option });
              }}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted transition-colors aria-pressed:bg-eucalyptus-700 aria-pressed:text-white"
            >
              {option === 'day' ? 'Dia' : 'Semana'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <nav aria-label="Navegar na agenda" className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              update({ date: shiftDate(view, date, timezone, -1) });
            }}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            {view === 'day' ? 'Dia anterior' : 'Semana anterior'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              update({ date: todayIn(timezone) });
            }}
          >
            Hoje
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              update({ date: shiftDate(view, date, timezone, 1) });
            }}
          >
            {view === 'day' ? 'Próximo dia' : 'Próxima semana'}
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </nav>
        <p className="text-sm text-muted">Horários no fuso {timezone}.</p>
      </div>

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
    <section aria-label={label} className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-ink first-letter:uppercase">{label}</h2>
      {appointments.length === 0 ? (
        <p className="text-sm text-muted">Nenhum agendamento.</p>
      ) : (
        // A timeline: the rail and dots show the day's order at a glance.
        <ol className="ml-2 flex flex-col gap-3 border-l-2 border-eucalyptus-200 pl-5">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className={`${CARD_CLASSES} relative flex flex-col gap-2 p-4 ${
                appointment.status === 'CANCELED' ? 'opacity-70' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className="absolute top-5 -left-[1.95rem] size-3 rounded-full border-2 border-white bg-eucalyptus-700"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display font-semibold text-ink tabular-nums">
                  {formatTime(appointment.startsAt, timezone)}–
                  {formatTime(appointment.endsAt, timezone)} · {appointment.service.name}
                </span>
                <StatusBadge status={appointment.status} />
              </div>
              <span className="flex items-center gap-2 text-sm text-muted">
                <Avatar name={appointment.client.name} size="sm" />
                <span>{appointment.client.name}</span>
              </span>
              {/* The provider may cancel at any time before the start. */}
              {appointment.status === 'SCHEDULED' && new Date(appointment.startsAt) > now && (
                <CancelAppointmentButton appointmentId={appointment.id} />
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
