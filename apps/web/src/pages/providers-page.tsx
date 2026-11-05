import { Link, useSearchParams } from 'react-router';
import { useProviders } from '../api/providers';
import { Button } from '../components/ui/button';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';

// The page lives in the URL, so reloading or going back keeps the user where they were.
function usePageParam(): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const setPage = (next: number) => {
    setSearchParams({ page: String(next) });
  };
  return [page, setPage];
}

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
      {totalPages > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-center gap-4">
          <Button
            disabled={page <= 1}
            onClick={() => {
              setPage(page - 1);
            }}
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-600">
            Página {page} de {totalPages}
          </span>
          <Button
            disabled={page >= totalPages}
            onClick={() => {
              setPage(page + 1);
            }}
          >
            Próxima
          </Button>
        </nav>
      )}
    </section>
  );
}
