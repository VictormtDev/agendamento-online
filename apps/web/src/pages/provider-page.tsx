import { Link, useParams } from 'react-router';
import { useProviderProfile } from '../api/providers';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';
import { formatDuration, formatPrice } from '../lib/format';

export function ProviderPage() {
  const { id = '' } = useParams();
  const profile = useProviderProfile(id);

  return (
    <section className="flex flex-col gap-4">
      <Link to="/providers" className="text-sm text-slate-600 underline">
        ← Voltar para profissionais
      </Link>
      {profile.isPending && <LoadingMessage />}
      {profile.isError && <ErrorMessage error={profile.error} />}
      {profile.isSuccess && (
        <>
          <h1 className="text-2xl font-semibold text-slate-900">{profile.data.provider.name}</h1>
          <h2 className="text-lg font-medium text-slate-900">Serviços</h2>
          {profile.data.services.length === 0 ? (
            <p className="text-slate-600">Este profissional não tem serviços disponíveis.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {profile.data.services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between rounded-lg bg-white p-4 shadow"
                >
                  <div>
                    <span className="block font-medium text-slate-900">{service.name}</span>
                    <span className="text-sm text-slate-600">
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-slate-900">
                      {formatPrice(service.priceCents)}
                    </span>
                    <Link
                      to={`/providers/${profile.data.provider.id}/services/${service.id}/book`}
                      aria-label={`Agendar ${service.name}`}
                      className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
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
