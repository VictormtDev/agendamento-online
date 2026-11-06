import { Check, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useReplaceAvailability, type AvailabilityWindow } from '../../api/schedule';
import { Button } from '../../components/ui/button';
import { CARD_CLASSES } from '../../components/ui/card';
import { FormError } from '../../components/ui/form-error';
import { INPUT_CLASSES } from '../../components/ui/text-field';

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
            className={`${CARD_CLASSES} flex flex-col gap-3 p-4`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">{label}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  add(weekday);
                }}
              >
                <Plus aria-hidden="true" className="size-4" />
                Adicionar horário
              </Button>
            </div>
            {dayWindows.length === 0 && <p className="text-sm text-muted">Sem atendimento.</p>}
            {dayWindows.map((window) => (
              <div key={window.key} className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  aria-label="Início"
                  step={TIME_STEP_SECONDS}
                  value={window.startTime}
                  onChange={(event) => {
                    change(window.key, { startTime: event.target.value });
                  }}
                  className={`${INPUT_CLASSES} py-1.5 tabular-nums`}
                />
                <span className="text-sm text-muted">até</span>
                <input
                  type="time"
                  aria-label="Fim"
                  step={TIME_STEP_SECONDS}
                  value={window.endTime}
                  onChange={(event) => {
                    change(window.key, { endTime: event.target.value });
                  }}
                  className={`${INPUT_CLASSES} py-1.5 tabular-nums`}
                />
                <Button
                  variant="danger-ghost"
                  size="sm"
                  onClick={() => {
                    remove(window.key);
                  }}
                >
                  <X aria-hidden="true" className="size-4" />
                  Remover horário
                </Button>
              </div>
            ))}
          </section>
        );
      })}

      <FormError error={replaceAvailability.error} />
      {replaceAvailability.isSuccess && (
        <p
          role="status"
          className="flex items-center gap-1.5 text-sm font-medium text-eucalyptus-700"
        >
          <Check aria-hidden="true" className="size-4" />
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
