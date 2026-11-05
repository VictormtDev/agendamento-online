// The target audience is Brazilian, so this is the sensible default until the provider says otherwise.
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

const STARTS_WITH_LETTER = /^[A-Za-z]/;

/**
 * Accepts only canonical IANA names, as spelled by the runtime ("America/Sao_Paulo",
 * "UTC"). Fixed offsets like "-03:00" are rejected because they ignore daylight
 * saving changes, and aliases/case variants are rejected so stored values stay uniform.
 */
export function isValidTimezone(timezone: string): boolean {
  if (!STARTS_WITH_LETTER.test(timezone)) {
    return false;
  }
  try {
    const resolved = new Intl.DateTimeFormat('en-US', { timeZone: timezone }).resolvedOptions();
    return resolved.timeZone === timezone;
  } catch {
    // Intl throws a RangeError for unknown zones.
    return false;
  }
}
