import { useState } from 'react';
import { useCancelAppointment } from '../../api/appointments';
import { Button } from '../../components/ui/button';

/** Asks for confirmation inline, then cancels; a refusal of the API is shown as it comes. */
export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const cancel = useCancelAppointment();

  return (
    <div className="flex flex-col gap-1">
      {cancel.error && (
        <p role="alert" className="text-sm text-red-600">
          {cancel.error.message}
        </p>
      )}
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">Cancelar este agendamento?</span>
          <Button
            disabled={cancel.isPending}
            onClick={() => {
              cancel.mutate(appointmentId, {
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
      )}
    </div>
  );
}
