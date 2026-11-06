import { Clock } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useProviderProfile } from '../api/providers';
import { Avatar } from '../components/ui/avatar';
import { BackLink } from '../components/ui/back-link';
import { buttonClasses } from '../components/ui/button';
import { CARD_CLASSES } from '../components/ui/card';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';
import { formatDuration, formatPrice } from '../lib/format';

export function ProviderPage() {
  const { id = '' } = useParams();
  const profile = useProviderProfile(id);

  return (
    <section className="flex flex-col gap-6">
      <BackLink to="/providers">Voltar para profissionais</BackLink>
      {profile.isPending && <LoadingMessage />}
      {profile.isError && <ErrorMessage error={profile.error} />}
      {profile.isSuccess && (
        <>
          <header className="flex items-center gap-4">
            <Avatar name={profile.data.provider.name} size="lg" />
            <h1 className="text-3xl font-bold text-ink">{profile.data.provider.name}</h1>
          </header>
          <h2 className="text-xl font-semibold text-ink">Serviços</h2>
          {profile.data.services.length === 0 ? (
            <p className="text-muted">Este profissional não tem serviços disponíveis.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {profile.data.services.map((service) => (
                <li
                  key={service.id}
                  className={`${CARD_CLASSES} flex items-center justify-between gap-4 p-5`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-display text-lg font-semibold text-ink">
                      {service.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <Clock aria-hidden="true" className="size-3.5" />
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-display text-lg font-semibold text-eucalyptus-800 tabular-nums">
                      {formatPrice(service.priceCents)}
                    </span>
                    <Link
                      to={`/providers/${profile.data.provider.id}/services/${service.id}/book`}
                      aria-label={`Agendar ${service.name}`}
                      className={buttonClasses('primary', 'sm')}
                    >
                      Agendar
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
