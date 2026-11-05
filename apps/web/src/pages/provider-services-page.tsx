import { useState } from 'react';
import { useProviderProfile, type ServiceSummary } from '../api/providers';
import { useCreateService, useDeleteService, useUpdateService } from '../api/services';
import { Button } from '../components/ui/button';
import { ErrorMessage, LoadingMessage } from '../components/ui/query-state';
import { useSignedInUser } from '../features/auth/auth-context';
import { ServiceForm } from '../features/services/service-form';
import { formatDuration, formatPrice } from '../lib/format';

export function ProviderServicesPage() {
  const user = useSignedInUser();
  const profile = useProviderProfile(user.id);
  const createService = useCreateService();
  // Remounting the form after a creation clears it.
  const [createdCount, setCreatedCount] = useState(0);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Serviços</h1>

      <h2 className="text-lg font-medium text-slate-900">Novo serviço</h2>
      <ServiceForm
        key={createdCount}
        submitLabel={createService.isPending ? 'Salvando...' : 'Adicionar serviço'}
        isPending={createService.isPending}
        error={createService.error}
        onSubmit={(input) => {
          createService.mutate(input, {
            onSuccess: () => {
              setCreatedCount((count) => count + 1);
            },
          });
        }}
      />

      <h2 className="text-lg font-medium text-slate-900">Seus serviços</h2>
      {profile.isPending && <LoadingMessage />}
      {profile.isError && <ErrorMessage error={profile.error} />}
      {profile.isSuccess &&
        (profile.data.services.length === 0 ? (
          <p className="text-slate-600">
            Nenhum serviço ainda. Sem serviços, você não aparece na lista de profissionais.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {profile.data.services.map((service) => (
              <ServiceRow key={service.id} service={service} />
            ))}
          </ul>
        ))}
    </section>
  );
}

function ServiceRow({ service }: { service: ServiceSummary }) {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view');
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  if (mode === 'edit') {
    return (
      <li>
        <ServiceForm
          initial={service}
          submitLabel={updateService.isPending ? 'Salvando...' : 'Salvar'}
          isPending={updateService.isPending}
          error={updateService.error}
          onSubmit={(input) => {
            updateService.mutate(
              { id: service.id, ...input },
              {
                onSuccess: () => {
                  setMode('view');
                },
              },
            );
          }}
          onCancel={() => {
            updateService.reset();
            setMode('view');
          }}
        />
      </li>
    );
  }

  return (
    <li aria-label={service.name} className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="block font-medium text-slate-900">{service.name}</span>
          <span className="text-sm text-slate-600">
            {formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}
          </span>
        </div>
        {mode === 'view' && (
          <div className="flex gap-2">
            <button
              type="button"
              className="text-sm text-slate-700 underline"
              onClick={() => {
                setMode('edit');
              }}
            >
              Editar
            </button>
            <button
              type="button"
              className="text-sm text-red-700 underline"
              onClick={() => {
                deleteService.reset();
                setMode('confirm-delete');
              }}
            >
              Remover
            </button>
          </div>
        )}
      </div>
      {deleteService.error && (
        <p role="alert" className="text-sm text-red-600">
          {deleteService.error.message}
        </p>
      )}
      {mode === 'confirm-delete' && (
        <div className="flex items-center gap-2">
          {/* Soft delete in the API: booked appointments keep their service. */}
          <span className="text-sm text-slate-700">
            Remover este serviço? Agendamentos já feitos continuam valendo.
          </span>
          <Button
            disabled={deleteService.isPending}
            onClick={() => {
              deleteService.mutate(service.id, {
                onError: () => {
                  setMode('view');
                },
              });
            }}
          >
            Sim, remover
          </Button>
          <button
            type="button"
            className="px-2 text-sm text-slate-700 underline"
            onClick={() => {
              setMode('view');
            }}
          >
            Manter
          </button>
        </div>
      )}
    </li>
  );
}
