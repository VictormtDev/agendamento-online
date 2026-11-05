import { useState } from 'react';
import { Link } from 'react-router';
import { useCreateAppointment, type Appointment, type Slot } from '../../api/booking';
import { ApiError } from '../../api/http-client';
import type { ProviderProfile, ServiceSummary } from '../../api/providers';
import { Button } from '../../components/ui/button';
import { formatDateTime, formatDuration, formatPrice, todayIn } from '../../lib/format';
import { SlotPicker } from './slot-picker';

interface BookingFlowProps {
  provider: ProviderProfile['provider'];
  service: ServiceSummary;
}

/** Date and time → confirmation → done. Each step is derived from what was chosen so far. */
export function BookingFlow({ provider, service }: BookingFlowProps) {
  // "Today" is the provider's: near midnight it can differ from the device's date.
  const [today] = useState(() => todayIn(provider.timezone));
  const [date, setDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [booked, setBooked] = useState<Appointment | null>(null);
  const createAppointment = useCreateAppointment();

  const confirm = (slot: Slot) => {
    createAppointment.mutate(
      { providerId: provider.id, serviceId: service.id, startsAt: slot.startsAt },
      {
        onSuccess: setBooked,
        onError: (error) => {
          // Someone else took the time between listing and confirming: back to the
          // (now refreshed) list instead of a dead end.
          if (error instanceof ApiError && error.code === 'SLOT_UNAVAILABLE') {
            setSelectedSlot(null);
            setNotice('Esse horário acabou de ser reservado. Escolha outro.');
          }
        },
      },
    );
  };

  const summary = (startsAt: string) => (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-slate-700">
      <dt className="font-medium">Profissional</dt>
      <dd>{provider.name}</dd>
      <dt className="font-medium">Serviço</dt>
      <dd>{service.name}</dd>
      <dt className="font-medium">Quando</dt>
      <dd>{formatDateTime(startsAt, provider.timezone)}</dd>
      <dt className="font-medium">Duração</dt>
      <dd>{formatDuration(service.durationMinutes)}</dd>
      <dt className="font-medium">Preço</dt>
      <dd>{formatPrice(service.priceCents)}</dd>
    </dl>
  );

  if (booked) {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-green-700">Agendamento confirmado!</h2>
        {summary(booked.startsAt)}
        <Link to="/providers" className="text-sm text-slate-600 underline">
          Ver outros profissionais
        </Link>
      </div>
    );
  }

  if (selectedSlot) {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Confirme o agendamento</h2>
        {summary(selectedSlot.startsAt)}
        {createAppointment.error && (
          <p role="alert" className="text-sm text-red-600">
            {createAppointment.error.message}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            disabled={createAppointment.isPending}
            onClick={() => {
              confirm(selectedSlot);
            }}
          >
            {createAppointment.isPending ? 'Confirmando...' : 'Confirmar agendamento'}
          </Button>
          <button
            type="button"
            className="px-4 py-2 text-slate-700 underline"
            onClick={() => {
              createAppointment.reset();
              setSelectedSlot(null);
            }}
          >
            Escolher outro horário
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p role="alert" className="text-sm text-red-600">
          {notice}
        </p>
      )}
      <SlotPicker
        providerId={provider.id}
        serviceId={service.id}
        timezone={provider.timezone}
        minDate={today}
        date={date}
        onDateChange={(next) => {
          setNotice(null);
          setDate(next);
        }}
        onSelect={(slot) => {
          setNotice(null);
          createAppointment.reset();
          setSelectedSlot(slot);
        }}
      />
    </div>
  );
}
