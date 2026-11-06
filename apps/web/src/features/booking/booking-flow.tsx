import {
  CalendarDays,
  CircleCheck,
  Clock,
  Scissors,
  TriangleAlert,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useCreateAppointment, type Appointment, type Slot } from '../../api/booking';
import { ApiError } from '../../api/http-client';
import type { ProviderProfile, ServiceSummary } from '../../api/providers';
import { Button } from '../../components/ui/button';
import { CARD_CLASSES } from '../../components/ui/card';
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
    <dl className="flex flex-col gap-3">
      <SummaryRow icon={UserRound} term="Profissional" value={provider.name} />
      <SummaryRow icon={Scissors} term="Serviço" value={service.name} />
      <SummaryRow
        icon={CalendarDays}
        term="Quando"
        value={formatDateTime(startsAt, provider.timezone)}
      />
      <SummaryRow icon={Clock} term="Duração" value={formatDuration(service.durationMinutes)} />
      <SummaryRow icon={Wallet} term="Preço" value={formatPrice(service.priceCents)} />
    </dl>
  );

  if (booked) {
    return (
      <div className={`${CARD_CLASSES} flex flex-col gap-6 p-6 shadow-lift sm:p-8`}>
        <div className="flex items-center gap-3">
          <CircleCheck aria-hidden="true" className="size-8 text-eucalyptus-700" />
          <h2 className="text-2xl font-bold text-eucalyptus-800">Agendamento confirmado!</h2>
        </div>
        {summary(booked.startsAt)}
        <Link
          to="/appointments"
          className="w-fit text-sm font-medium text-eucalyptus-700 underline-offset-4 hover:underline"
        >
          Ver meus agendamentos
        </Link>
      </div>
    );
  }

  if (selectedSlot) {
    return (
      <div className={`${CARD_CLASSES} flex flex-col gap-6 p-6 shadow-lift sm:p-8`}>
        <h2 className="text-2xl font-bold text-ink">Confirme o agendamento</h2>
        {summary(selectedSlot.startsAt)}
        {createAppointment.error && (
          <p role="alert" className="text-sm text-ruby-700">
            {createAppointment.error.message}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={createAppointment.isPending}
            onClick={() => {
              confirm(selectedSlot);
            }}
          >
            {createAppointment.isPending ? 'Confirmando...' : 'Confirmar agendamento'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              createAppointment.reset();
              setSelectedSlot(null);
            }}
          >
            Escolher outro horário
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-saffron-50 p-3 text-sm font-medium text-saffron-700"
        >
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
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

interface SummaryRowProps {
  icon: LucideIcon;
  term: string;
  value: string;
}

function SummaryRow({ icon: Icon, term, value }: SummaryRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-eucalyptus-600" />
      <div className="flex flex-col">
        <dt className="text-xs font-medium text-muted">{term}</dt>
        <dd className="text-ink">{value}</dd>
      </div>
    </div>
  );
}
