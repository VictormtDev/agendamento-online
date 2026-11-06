import { useState } from 'react';
import { useCancelAppointment } from '../../api/appointments';
import { Button } from '../../components/ui/button';

/** Asks for confirmation inline, then cancels; a refusal of the API is shown as it comes. */
export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const cancel = useCancelAppointment();

  return (
    <div className="flex flex-col gap-2">
      {cancel.error && (
        <p role="alert" className="text-sm text-ruby-700">
          {cancel.error.message}
        </p>
      )}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ruby-50 p-2 pl-3">
          <span className="text-sm font-medium text-ruby-700">Cancelar este agendamento?</span>
          <Button
            variant="danger"
            size="sm"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setConfirming(false);
            }}
          >
            Manter
          </Button>
        </div>
      ) : (
        <Button
          variant="danger-ghost"
          size="sm"
          className="-ml-3 w-fit"
          onClick={() => {
            cancel.reset();
            setConfirming(true);
          }}
        >
          Cancelar agendamento
        </Button>
      )}
    </div>
  );
}
