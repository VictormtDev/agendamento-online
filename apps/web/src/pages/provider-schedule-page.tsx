import { useAvailability } from '../api/schedule';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';
import { useSignedInUser } from '../features/auth/auth-context';
import { AvailabilityEditor } from '../features/schedule/availability-editor';
import { TimeOffSection } from '../features/schedule/time-off-section';

export function ProviderSchedulePage() {
  const { timezone } = useSignedInUser();
  const availability = useAvailability();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-ink">Horários</h1>
      <p className="-mt-4 text-sm text-muted">Horários no fuso {timezone}.</p>

      <h2 className="text-xl font-semibold text-ink">Grade semanal</h2>
      {availability.isPending && <LoadingMessage />}
      {availability.isError && <ErrorMessage error={availability.error} />}
      {/* Mounted only with the saved grid, which seeds the editor's local draft. */}
      {availability.isSuccess && <AvailabilityEditor initial={availability.data} />}

      <h2 className="text-xl font-semibold text-ink">Folgas</h2>
      <TimeOffSection timezone={timezone} />
    </section>
  );
}
