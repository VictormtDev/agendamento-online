import { Link } from 'react-router';
import { useProviders } from '../api/providers';
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
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Profissionais</h1>
      {data.length === 0 ? (
        <p className="text-slate-600">Nenhum profissional disponível no momento.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.map((provider) => (
            <li key={provider.id}>
              <Link
                to={`/providers/${provider.id}`}
                className="block rounded-lg bg-white p-4 shadow hover:shadow-md"
              >
                <span className="block font-medium text-slate-900">{provider.name}</span>
                <span className="text-sm text-slate-600">
                  {provider.activeServiceCount === 1
                    ? '1 serviço'
                    : `${String(provider.activeServiceCount)} serviços`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}
