import { useState } from 'react';
import { useCancelAppointment, type ClientAppointment } from '../../api/appointments';
import type { Appointment } from '../../api/booking';
import { Button } from '../../components/ui/button';
import { formatDateTime, formatPrice } from '../../lib/format';

const STATUS_LABELS: Record<Appointment['status'], string> = {
  SCHEDULED: 'Agendado',
  CANCELED: 'Cancelado',
  COMPLETED: 'Concluído',
  NO_SHOW: 'Não compareceu',
};

interface AppointmentCardProps {
  appointment: ClientAppointment;
  now: Date;
}

export function AppointmentCard({ appointment, now }: AppointmentCardProps) {
  const [confirming, setConfirming] = useState(false);
  const cancel = useCancelAppointment();
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

      {cancel.error && (
        <p role="alert" className="text-sm text-red-600">
          {cancel.error.message}
        </p>
      )}
      {canTryToCancel &&
        (confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-700">Cancelar este agendamento?</span>
            <Button
              disabled={cancel.isPending}
              onClick={() => {
                cancel.mutate(appointment.id, {
                  onSettled: () => {
                    setConfirming(false);
                  },
                });
              }}
            >
              {cancel.isPending ? 'Cancelando...' : 'Sim, cancelar'}
            </Button>
            <button
              type="button"
              className="px-2 text-sm text-slate-700 underline"
              onClick={() => {
                setConfirming(false);
              }}
            >
              Manter
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="w-fit text-sm text-red-700 underline"
            onClick={() => {
              cancel.reset();
              setConfirming(true);
            }}
          >
            Cancelar agendamento
          </button>
        ))}
    </li>
  );
}
