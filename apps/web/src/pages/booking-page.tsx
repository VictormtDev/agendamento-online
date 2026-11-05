import { Link, useParams } from 'react-router';
import { useProviderProfile } from '../api/providers';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';
import { BookingFlow } from '../features/booking/booking-flow';
import { formatDuration, formatPrice } from '../lib/format';

export function BookingPage() {
  const { id = '', serviceId = '' } = useParams();
  // Usually already cached by the provider page the user came from.
  const profile = useProviderProfile(id);

  if (profile.isPending) {
    return <LoadingMessage />;
  }
  if (profile.isError) {
    return <ErrorMessage error={profile.error} />;
  }

  const { provider, services } = profile.data;
  const service = services.find((item) => item.id === serviceId);

  return (
    <section className="flex flex-col gap-4">
      <Link to={`/providers/${provider.id}`} className="text-sm text-slate-600 underline">
        ← Voltar para {provider.name}
      </Link>
      {service ? (
        <>
          <h1 className="text-2xl font-semibold text-slate-900">Agendar {service.name}</h1>
          <p className="text-slate-600">
            {provider.name} · {formatDuration(service.durationMinutes)} ·{' '}
            {formatPrice(service.priceCents)}
          </p>
          <BookingFlow provider={provider} service={service} />
        </>
      ) : (
        // An old link to a service the provider has since removed.
        <p role="alert" className="text-red-600">
          Serviço não encontrado.
        </p>
      )}
    </section>
  );
}
