import { CalendarOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCreateTimeOff, useDeleteTimeOff, useTimeOffs, type TimeOff } from '../../api/schedule';
import { Button } from '../../components/ui/button';
import { CARD_CLASSES } from '../../components/ui/card';
import { FormError } from '../../components/ui/form-error';
import { ErrorMessage, LoadingMessage } from '../../components/ui/query-state';
import { TextField } from '../../components/ui/text-field';
import { formatDateTime } from '../../lib/format';
import { localDateTimeToInstant } from '../../lib/local-time';

export function TimeOffSection({ timezone }: { timezone: string }) {
  const timeOffs = useTimeOffs();

  return (
    <div className="flex flex-col gap-3">
      <TimeOffForm timezone={timezone} />
      {timeOffs.isPending && <LoadingMessage />}
      {timeOffs.isError && <ErrorMessage error={timeOffs.error} />}
      {timeOffs.isSuccess &&
        (timeOffs.data.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Nenhuma folga marcada.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {timeOffs.data.map((timeOff) => (
              <TimeOffRow key={timeOff.id} timeOff={timeOff} timezone={timezone} />
            ))}
          </ul>
        ))}
    </div>
  );
}

function TimeOffForm({ timezone }: { timezone: string }) {
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [reason, setReason] = useState('');
  const [missingDates, setMissingDates] = useState(false);
  const createTimeOff = useCreateTimeOff();

  const submit = () => {
    if (!startsAt || !endsAt) {
      setMissingDates(true);
      return;
    }
    setMissingDates(false);
    createTimeOff.mutate(
      {
        // The inputs hold wall-clock times of the provider, wherever the browser is.
        startsAt: localDateTimeToInstant(startsAt, timezone).toISOString(),
        endsAt: localDateTimeToInstant(endsAt, timezone).toISOString(),
        ...(reason.trim() && { reason: reason.trim() }),
      },
      {
        onSuccess: () => {
          setStartsAt('');
          setEndsAt('');
          setReason('');
        },
      },
    );
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className={`${CARD_CLASSES} flex flex-col gap-4 p-5`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Início da folga"
          type="datetime-local"
          value={startsAt}
          onChange={(event) => {
            setStartsAt(event.target.value);
          }}
        />
        <TextField
          label="Fim da folga"
          type="datetime-local"
          value={endsAt}
          onChange={(event) => {
            setEndsAt(event.target.value);
          }}
        />
      </div>
      <TextField
        label="Motivo (opcional)"
        maxLength={200}
        value={reason}
        onChange={(event) => {
          setReason(event.target.value);
        }}
      />
      {missingDates && (
        <p role="alert" className="text-sm text-ruby-700">
          Informe o início e o fim da folga.
        </p>
      )}
      <FormError error={createTimeOff.error} />
      <Button type="submit" className="w-fit" disabled={createTimeOff.isPending}>
        {createTimeOff.isPending ? 'Salvando...' : 'Adicionar folga'}
      </Button>
    </form>
  );
}

function TimeOffRow({ timeOff, timezone }: { timeOff: TimeOff; timezone: string }) {
  const deleteTimeOff = useDeleteTimeOff();

  return (
    <li className={`${CARD_CLASSES} flex flex-col gap-2 p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CalendarOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-saffron-600" />
          <div className="flex flex-col gap-0.5">
            <span className="text-ink">
              {formatDateTime(timeOff.startsAt, timezone)} até{' '}
              {formatDateTime(timeOff.endsAt, timezone)}
            </span>
            {timeOff.reason && <span className="text-sm text-muted">{timeOff.reason}</span>}
          </div>
        </div>
        <Button
          variant="danger-ghost"
          size="sm"
          disabled={deleteTimeOff.isPending}
          onClick={() => {
            deleteTimeOff.mutate(timeOff.id);
          }}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Remover folga
        </Button>
      </div>
      <FormError error={deleteTimeOff.error} />
    </li>
  );
}
