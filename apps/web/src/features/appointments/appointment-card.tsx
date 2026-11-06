import type { ClientAppointment } from '../../api/appointments';
import { Avatar } from '../../components/ui/avatar';
import { CARD_CLASSES } from '../../components/ui/card';
import { StatusBadge } from '../../components/ui/status-badge';
import { formatDateTime, formatPrice } from '../../lib/format';
import { CancelAppointmentButton } from './cancel-appointment-button';

interface AppointmentCardProps {
  appointment: ClientAppointment;
  now: Date;
}

// The date block reads the provider timezone, like every time shown for the appointment.
function dateBlock(instant: string, timezone: string) {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, ...options }).format(new Date(instant));
  return { month: part({ month: 'short' }).replace('.', ''), day: part({ day: 'numeric' }) };
}

export function AppointmentCard({ appointment, now }: AppointmentCardProps) {
  const { service, provider } = appointment;
  // Only the "has it started" check lives here, to hide a pointless button. The 24-hour
  // deadline is the API's to enforce; its refusal is shown as it comes, so the rule
  // is never written twice.
  const canTryToCancel = appointment.status === 'SCHEDULED' && new Date(appointment.startsAt) > now;
  const { month, day } = dateBlock(appointment.startsAt, provider.timezone);

  return (
    <li
      className={`${CARD_CLASSES} flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5 ${
        appointment.status === 'CANCELED' ? 'opacity-70' : ''
      }`}
    >
      <div
        aria-hidden="true"
        className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-eucalyptus-50 py-2 text-eucalyptus-800"
      >
        <span className="text-xs font-medium capitalize">{month}</span>
        <span className="font-display text-2xl leading-none font-bold tabular-nums">{day}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-display text-lg font-semibold text-ink">{service.name}</span>
        <span className="flex items-center gap-2 text-sm text-muted">
          <Avatar name={provider.name} size="sm" />
          com {provider.name}
        </span>
        <span className="text-sm text-muted">
          {formatDateTime(appointment.startsAt, provider.timezone)}
        </span>
        {canTryToCancel && (
          <div className="mt-2">
            <CancelAppointmentButton appointmentId={appointment.id} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <StatusBadge status={appointment.status} />
        <span className="font-display font-semibold text-ink tabular-nums">
          {formatPrice(service.priceCents)}
        </span>
      </div>
    </li>
  );
}
