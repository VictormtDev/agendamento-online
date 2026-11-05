import { useState } from 'react';
import { useCreateTimeOff, useDeleteTimeOff, useTimeOffs, type TimeOff } from '../../api/schedule';
import { Button } from '../../components/ui/button';
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
          <p className="text-sm text-slate-500">Nenhuma folga marcada.</p>
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
      className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow"
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
        <p role="alert" className="text-sm text-red-600">
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
    <li className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="block text-slate-900">
            {formatDateTime(timeOff.startsAt, timezone)} até{' '}
            {formatDateTime(timeOff.endsAt, timezone)}
          </span>
          {timeOff.reason && <span className="text-sm text-slate-600">{timeOff.reason}</span>}
        </div>
        <button
          type="button"
          className="text-sm text-red-700 underline disabled:opacity-50"
          disabled={deleteTimeOff.isPending}
          onClick={() => {
            deleteTimeOff.mutate(timeOff.id);
          }}
        >
          Remover folga
        </button>
      </div>
      <FormError error={deleteTimeOff.error} />
    </li>
  );
}
