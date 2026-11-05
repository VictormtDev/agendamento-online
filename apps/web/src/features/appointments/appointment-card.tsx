import type { ClientAppointment } from '../../api/appointments';
import { formatDateTime, formatPrice } from '../../lib/format';
import { CancelAppointmentButton } from './cancel-appointment-button';
import { STATUS_LABELS } from './status-labels';

interface AppointmentCardProps {
  appointment: ClientAppointment;
  now: Date;
}

export function AppointmentCard({ appointment, now }: AppointmentCardProps) {
  const { service, provider } = appointment;
  // Only the "has it started" check lives here, to hide a pointless button. The 24-hour
  // deadline is the API's to enforce; its refusal is shown as it comes, so the rule
  // is never written twice.
  const canTryToCancel = appointment.status === 'SCHEDULED' && new Date(appointment.startsAt) > now;

  return (
    <li className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="block font-medium text-slate-900">{service.name}</span>
          <span className="block text-sm text-slate-600">com {provider.name}</span>
          <span className="block text-sm text-slate-600">
            {formatDateTime(appointment.startsAt, provider.timezone)}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-sm font-medium text-slate-700">
            {STATUS_LABELS[appointment.status]}
          </span>
          <span className="block text-sm text-slate-600">{formatPrice(service.priceCents)}</span>
        </div>
      </div>
      {canTryToCancel && <CancelAppointmentButton appointmentId={appointment.id} />}
    </li>
  );
}
