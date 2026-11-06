import { CircleAlert, LoaderCircle } from 'lucide-react';

export function LoadingMessage() {
  return (
    <p role="status" className="flex items-center justify-center gap-2 p-8 text-muted">
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-eucalyptus-600" />
      Carregando...
    </p>
  );
}

export function ErrorMessage({ error }: { error: Error }) {
  return (
    <p role="alert" className="flex items-center justify-center gap-2 p-8 text-ruby-700">
      <CircleAlert aria-hidden="true" className="size-5" />
      {error.message}
    </p>
  );
}
