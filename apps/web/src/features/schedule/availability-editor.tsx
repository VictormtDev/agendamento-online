import { useRef, useState } from 'react';
import { useReplaceAvailability, type AvailabilityWindow } from '../../api/schedule';
import { Button } from '../../components/ui/button';
import { FormError } from '../../components/ui/form-error';

// Monday first, as Brazilian calendars do; the API numbers days from Sunday (0).
const WEEKDAYS = [
  { weekday: 1, label: 'Segunda-feira' },
  { weekday: 2, label: 'Terça-feira' },
  { weekday: 3, label: 'Quarta-feira' },
  { weekday: 4, label: 'Quinta-feira' },
  { weekday: 5, label: 'Sexta-feira' },
  { weekday: 6, label: 'Sábado' },
  { weekday: 0, label: 'Domingo' },
];

// Matches the 15-minute slots, so the picker offers only times the API accepts.
const TIME_STEP_SECONDS = 15 * 60;

interface DraftWindow extends AvailabilityWindow {
  key: number;
}

/**
 * Edits the whole week locally and saves it in one PUT, as the API replaces the grid
 * atomically. Overlaps and bad times are left to the API, whose reasons are shown.
 */
export function AvailabilityEditor({ initial }: { initial: AvailabilityWindow[] }) {
  const nextKey = useRef(initial.length);
  const [windows, setWindows] = useState<DraftWindow[]>(() =>
    initial.map(({ weekday, startTime, endTime }, key) => ({ key, weekday, startTime, endTime })),
  );
  const replaceAvailability = useReplaceAvailability();

  const change = (key: number, changes: Partial<AvailabilityWindow>) => {
    replaceAvailability.reset();
    setWindows((current) =>
      current.map((window) => (window.key === key ? { ...window, ...changes } : window)),
    );
  };
  const add = (weekday: number) => {
    replaceAvailability.reset();
    const key = nextKey.current++;
    setWindows((current) => [...current, { key, weekday, startTime: '09:00', endTime: '12:00' }]);
  };
  const remove = (key: number) => {
    replaceAvailability.reset();
    setWindows((current) => current.filter((window) => window.key !== key));
  };

  return (
    <div className="flex flex-col gap-3">
      {WEEKDAYS.map(({ weekday, label }) => {
        const dayWindows = windows.filter((window) => window.weekday === weekday);
        return (
          <section
            key={weekday}
            aria-label={label}
            className="flex flex-col gap-2 rounded-lg bg-white p-3 shadow"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">{label}</h3>
              <button
                type="button"
                className="text-sm text-slate-700 underline"
                onClick={() => {
                  add(weekday);
                }}
              >
                Adicionar horário
              </button>
            </div>
            {dayWindows.length === 0 && <p className="text-sm text-slate-500">Sem atendimento.</p>}
            {dayWindows.map((window) => (
              <div key={window.key} className="flex items-center gap-2">
                <input
                  type="time"
                  aria-label="Início"
                  step={TIME_STEP_SECONDS}
                  value={window.startTime}
                  onChange={(event) => {
                    change(window.key, { startTime: event.target.value });
                  }}
                  className="rounded-md border border-slate-300 px-2 py-1"
                />
                <span className="text-slate-600">até</span>
                <input
                  type="time"
                  aria-label="Fim"
                  step={TIME_STEP_SECONDS}
                  value={window.endTime}
                  onChange={(event) => {
                    change(window.key, { endTime: event.target.value });
                  }}
                  className="rounded-md border border-slate-300 px-2 py-1"
                />
                <button
                  type="button"
                  className="text-sm text-red-700 underline"
                  onClick={() => {
                    remove(window.key);
                  }}
                >
                  Remover horário
                </button>
              </div>
            ))}
          </section>
        );
      })}

      <FormError error={replaceAvailability.error} />
      {replaceAvailability.isSuccess && (
        <p role="status" className="text-sm text-green-700">
          Grade salva.
        </p>
      )}
      <Button
        className="w-fit"
        disabled={replaceAvailability.isPending}
        onClick={() => {
          replaceAvailability.mutate(
            windows.map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })),
          );
        }}
      >
        {replaceAvailability.isPending ? 'Salvando...' : 'Salvar grade'}
      </Button>
    </div>
  );
}
