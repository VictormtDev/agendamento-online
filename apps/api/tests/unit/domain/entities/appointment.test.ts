import { describe, expect, it } from 'vitest';
import { isWithinClientCancellationDeadline } from '../../../../src/domain/entities/appointment.js';

const STARTS_AT = new Date('2026-11-10T12:00:00.000Z');

describe('isWithinClientCancellationDeadline', () => {
  it('should allow cancelling more than 24 hours before the start', () => {
    expect(
      isWithinClientCancellationDeadline(STARTS_AT, new Date('2026-11-09T11:00:00.000Z')),
    ).toBe(true);
  });

  it('should allow cancelling exactly 24 hours before the start', () => {
    expect(
      isWithinClientCancellationDeadline(STARTS_AT, new Date('2026-11-09T12:00:00.000Z')),
    ).toBe(true);
  });

  it('should not allow cancelling less than 24 hours before the start', () => {
    expect(
      isWithinClientCancellationDeadline(STARTS_AT, new Date('2026-11-09T12:00:01.000Z')),
    ).toBe(false);
  });
});
