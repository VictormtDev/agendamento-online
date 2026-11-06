import { Moon, Sun, Sunrise, type LucideIcon } from 'lucide-react';
import { useSlots, type Slot } from '../../api/booking';
import { ErrorMessage, LoadingMessage } from '../../components/ui/query-state';
import { formatTime } from '../../lib/format';
import { groupSlotsByPeriod, type SlotPeriod } from '../../lib/slot-periods';
import { DayStrip } from './day-strip';

const PERIOD_ICONS: Record<SlotPeriod, LucideIcon> = {
  Manhã: Sunrise,
  Tarde: Sun,
  Noite: Moon,
};

interface SlotPickerProps {
  providerId: string;
  serviceId: string;
  timezone: string;
  minDate: string;
  date: string;
  onDateChange: (date: string) => void;
  onSelect: (slot: Slot) => void;
}

export function SlotPicker({
  providerId,
  serviceId,
  timezone,
  minDate,
  date,
  onDateChange,
  onSelect,
}: SlotPickerProps) {
  const slots = useSlots(providerId, serviceId, date);

  return (
    <div className="flex flex-col gap-6">
      <DayStrip minDate={minDate} date={date} timezone={timezone} onDateChange={onDateChange} />

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-ink">Horários</h2>
        <p className="text-sm text-muted">Horários no fuso {timezone}.</p>
      </div>
      {slots.isPending && <LoadingMessage />}
      {slots.isError && <ErrorMessage error={slots.error} />}
      {slots.isSuccess &&
        (slots.data.slots.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">
            Nenhum horário disponível nesta data.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {groupSlotsByPeriod(slots.data.slots, timezone).map(({ period, slots: group }) => {
              const Icon = PERIOD_ICONS[period];
              return (
                <div key={period} className="flex flex-col gap-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                    <Icon aria-hidden="true" className="size-4 text-saffron-600" />
                    {period}
                  </h3>
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                    {group.map((slot) => (
                      <li key={slot.startsAt}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(slot);
                          }}
                          className="w-full rounded-full border border-eucalyptus-200 bg-white py-2 font-medium text-eucalyptus-800 tabular-nums transition-colors hover:border-eucalyptus-700 hover:bg-eucalyptus-700 hover:text-white"
                        >
                          {formatTime(slot.startsAt, timezone)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
