import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { shiftDate, startOfCalendarDate } from '../../lib/agenda-range';
import { stripDays } from '../../lib/day-strip';
import { formatDayLabel } from '../../lib/format';

interface DayStripProps {
  /** The provider's today: the strip never goes before it. */
  minDate: string;
  date: string;
  timezone: string;
  onDateChange: (date: string) => void;
}

function dayParts(date: string, timezone: string) {
  const instant = startOfCalendarDate(date, timezone);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, ...options }).format(instant);
  return {
    // "qui." → "qui": the dot is noise in a narrow chip.
    weekday: part({ weekday: 'short' }).replace('.', ''),
    day: part({ day: 'numeric' }),
    label: formatDayLabel(instant, timezone),
  };
}

const ARROW_CLASSES =
  'grid size-10 shrink-0 place-items-center rounded-full text-eucalyptus-800 hover:bg-eucalyptus-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';

/**
 * A week of days to pick from. There is no upper limit here: past the booking window the
 * API returns no slots, so that rule stays written only once, in the backend.
 */
export function DayStrip({ minDate, date, timezone, onDateChange }: DayStripProps) {
  const [start, setStart] = useState(minDate);
  const days = stripDays(start, timezone);
  // ISO dates compare correctly as strings.
  const atFirstWeek = start <= minDate;

  return (
    <div role="group" aria-label="Data" className="flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        aria-label="Dias anteriores"
        disabled={atFirstWeek}
        onClick={() => {
          setStart(shiftDate('week', start, timezone, -1));
        }}
        className={ARROW_CLASSES}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </button>

      <ul className="grid flex-1 grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const { weekday, day: dayNumber, label } = dayParts(day, timezone);
          const selected = day === date;
          return (
            <li key={day}>
              <button
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={() => {
                  onDateChange(day);
                }}
                className={`relative flex w-full flex-col items-center gap-0.5 rounded-2xl border py-2 transition-colors sm:py-3 ${
                  selected
                    ? 'border-eucalyptus-700 bg-eucalyptus-700 text-white'
                    : 'border-line bg-white text-ink hover:border-eucalyptus-300'
                }`}
              >
                <span
                  className={`text-xs capitalize ${selected ? 'text-eucalyptus-100' : 'text-muted'}`}
                >
                  {weekday}
                </span>
                <span className="font-display text-xl font-semibold tabular-nums sm:text-2xl">
                  {dayNumber}
                </span>
                {day === minDate && !selected && (
                  <span className="absolute bottom-1 size-1.5 rounded-full bg-saffron-400" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        aria-label="Próximos dias"
        onClick={() => {
          setStart(shiftDate('week', start, timezone, 1));
        }}
        className={ARROW_CLASSES}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
