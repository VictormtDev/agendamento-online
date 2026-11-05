import { describe, expect, it } from 'vitest';
import { localDateTimeToInstant } from './local-time';

describe('localDateTimeToInstant', () => {
  it('should read the wall-clock time in the given timezone', () => {
    expect(localDateTimeToInstant('2026-12-20T09:00', 'America/Sao_Paulo').toISOString()).toBe(
      '2026-12-20T12:00:00.000Z',
    );
    expect(localDateTimeToInstant('2026-12-20T09:00', 'Asia/Tokyo').toISOString()).toBe(
      '2026-12-20T00:00:00.000Z',
    );
  });

  it('should apply daylight saving of the date, not of today', () => {
    // New York is UTC-4 in July and UTC-5 in December.
    expect(localDateTimeToInstant('2026-07-01T09:00', 'America/New_York').toISOString()).toBe(
      '2026-07-01T13:00:00.000Z',
    );
    expect(localDateTimeToInstant('2026-12-01T09:00', 'America/New_York').toISOString()).toBe(
      '2026-12-01T14:00:00.000Z',
    );
  });
});
