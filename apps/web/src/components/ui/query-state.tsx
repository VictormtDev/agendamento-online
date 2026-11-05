export function LoadingMessage() {
  return (
    <p role="status" className="p-8 text-center text-slate-600">
      Carregando...
    </p>
  );
}

export function ErrorMessage({ error }: { error: Error }) {
  return (
    <p role="alert" className="p-8 text-center text-red-600">
      {error.message}
    </p>
  );
}
