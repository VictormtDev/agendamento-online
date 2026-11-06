import { Clock, UserRound, Wallet } from 'lucide-react';
import { useParams } from 'react-router';
import { useProviderProfile } from '../api/providers';
import { BackLink } from '../components/ui/back-link';
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
    <section className="flex flex-col gap-6">
      <BackLink to={`/providers/${provider.id}`}>Voltar para {provider.name}</BackLink>
      {service ? (
        <>
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-ink">Agendar {service.name}</h1>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              <li className="flex items-center gap-1.5">
                <UserRound aria-hidden="true" className="size-4" />
                {provider.name}
              </li>
              <li className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-4" />
                {formatDuration(service.durationMinutes)}
              </li>
              <li className="flex items-center gap-1.5">
                <Wallet aria-hidden="true" className="size-4" />
                {formatPrice(service.priceCents)}
              </li>
            </ul>
          </header>
          <BookingFlow provider={provider} service={service} />
        </>
      ) : (
        // An old link to a service the provider has since removed.
        <p role="alert" className="text-ruby-700">
          Serviço não encontrado.
        </p>
      )}
    </section>
  );
}
