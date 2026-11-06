import { Clock, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useProviderProfile, type ServiceSummary } from '../api/providers';
import { useCreateService, useDeleteService, useUpdateService } from '../api/services';
import { Button } from '../components/ui/button';
import { CARD_CLASSES } from '../components/ui/card';
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
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-ink">Serviços</h1>

      <h2 className="text-xl font-semibold text-ink">Novo serviço</h2>
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

      <h2 className="text-xl font-semibold text-ink">Seus serviços</h2>
      {profile.isPending && <LoadingMessage />}
      {profile.isError && <ErrorMessage error={profile.error} />}
      {profile.isSuccess &&
        (profile.data.services.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">
            Nenhum serviço ainda. Sem serviços, você não aparece na lista de profissionais.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
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
    <li aria-label={service.name} className={`${CARD_CLASSES} flex flex-col gap-3 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-display text-lg font-semibold text-ink">{service.name}</span>
          <span className="flex items-center gap-1.5 text-sm text-muted tabular-nums">
            <Clock aria-hidden="true" className="size-3.5" />
            {formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}
          </span>
        </div>
        {mode === 'view' && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMode('edit');
              }}
            >
              <Pencil aria-hidden="true" className="size-4" />
              Editar
            </Button>
            <Button
              variant="danger-ghost"
              size="sm"
              onClick={() => {
                deleteService.reset();
                setMode('confirm-delete');
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Remover
            </Button>
          </div>
        )}
      </div>
      {deleteService.error && (
        <p role="alert" className="text-sm text-ruby-700">
          {deleteService.error.message}
        </p>
      )}
      {mode === 'confirm-delete' && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ruby-50 p-2 pl-3">
          {/* Soft delete in the API: booked appointments keep their service. */}
          <span className="text-sm font-medium text-ruby-700">
            Remover este serviço? Agendamentos já feitos continuam valendo.
          </span>
          <Button
            variant="danger"
            size="sm"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode('view');
            }}
          >
            Manter
          </Button>
        </div>
      )}
    </li>
  );
}
