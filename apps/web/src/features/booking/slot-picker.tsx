import { useId } from 'react';
import { useSlots, type Slot } from '../../api/booking';
import { ErrorMessage, LoadingMessage } from '../../components/ui/query-state';
import { formatTime } from '../../lib/format';

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
  const dateInputId = useId();
  const slots = useSlots(providerId, serviceId, date);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={dateInputId} className="text-sm font-medium text-slate-700">
          Data
        </label>
        <input
          id={dateInputId}
          type="date"
          min={minDate}
          value={date}
          onChange={(event) => {
            // Clearing the native picker yields ""; the last valid day stays selected.
            if (event.target.value) {
              onDateChange(event.target.value);
            }
          }}
          className="w-fit rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <h2 className="text-lg font-medium text-slate-900">Horários</h2>
      <p className="text-sm text-slate-600">Horários no fuso {timezone}.</p>
      {slots.isPending && <LoadingMessage />}
      {slots.isError && <ErrorMessage error={slots.error} />}
      {slots.isSuccess &&
        (slots.data.slots.length === 0 ? (
          <p className="text-slate-600">Nenhum horário disponível nesta data.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {slots.data.slots.map((slot) => (
              <li key={slot.startsAt}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(slot);
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white py-2 hover:border-slate-900"
                >
                  {formatTime(slot.startsAt, timezone)}
                </button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
