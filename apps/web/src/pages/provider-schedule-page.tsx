import { useAvailability } from '../api/schedule';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';
import { useSignedInUser } from '../features/auth/auth-context';
import { AvailabilityEditor } from '../features/schedule/availability-editor';
import { TimeOffSection } from '../features/schedule/time-off-section';

export function ProviderSchedulePage() {
  const { timezone } = useSignedInUser();
  const availability = useAvailability();

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Horários</h1>
      <p className="text-sm text-slate-600">Horários no fuso {timezone}.</p>

      <h2 className="text-lg font-medium text-slate-900">Grade semanal</h2>
      {availability.isPending && <LoadingMessage />}
      {availability.isError && <ErrorMessage error={availability.error} />}
      {/* Mounted only with the saved grid, which seeds the editor's local draft. */}
      {availability.isSuccess && <AvailabilityEditor initial={availability.data} />}

      <h2 className="text-lg font-medium text-slate-900">Folgas</h2>
      <TimeOffSection timezone={timezone} />
    </section>
  );
}
