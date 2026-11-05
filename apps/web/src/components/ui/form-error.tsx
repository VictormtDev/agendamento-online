import { ApiError } from '../../api/http-client';

/** The API message, plus its field reasons when it refused the data as invalid. */
export function FormError({ error }: { error: Error | null }) {
  if (!error) {
    return null;
  }
  // The same reason can repeat across fields (e.g. two windows with a bad time).
  const reasons = error instanceof ApiError ? [...new Set(error.issues.map((i) => i.message))] : [];

  return (
    <div role="alert" className="text-sm text-red-600">
      <p>{error.message}</p>
      {reasons.length > 0 && (
        <ul className="list-inside list-disc">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
