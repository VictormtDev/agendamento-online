import { ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { useProviders } from '../api/providers';
import { Avatar } from '../components/ui/avatar';
import { CARD_CLASSES } from '../components/ui/card';
import { Pagination, usePageParam } from '../components/ui/pagination';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';

export function ProvidersPage() {
  const [page, setPage] = usePageParam();
  const providers = useProviders(page);

  if (providers.isPending) {
    return <LoadingMessage />;
  }
  if (providers.isError) {
    return <ErrorMessage error={providers.error} />;
  }

  const { data, meta } = providers.data;
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.perPage));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-ink">Profissionais</h1>
        <p className="text-muted">Escolha com quem você quer agendar.</p>
      </header>
      {data.length === 0 ? (
        <p className="text-muted">Nenhum profissional disponível no momento.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((provider) => (
            <li key={provider.id}>
              <Link
                to={`/providers/${provider.id}`}
                className={`${CARD_CLASSES} group flex items-center gap-4 p-4 transition-colors hover:border-eucalyptus-300`}
              >
                <Avatar name={provider.name} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-display text-lg font-semibold text-ink">
                    {provider.name}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <Sparkles aria-hidden="true" className="size-3.5 text-saffron-600" />
                    {provider.activeServiceCount === 1
                      ? '1 serviço'
                      : `${String(provider.activeServiceCount)} serviços`}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 text-eucalyptus-300 transition-transform group-hover:translate-x-0.5 group-hover:text-eucalyptus-700"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}
