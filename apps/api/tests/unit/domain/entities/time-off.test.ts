import { describe, expect, it } from 'vitest';
import { isValidTimeOffPeriod } from '../../../../src/domain/entities/time-off.js';

const NOW = new Date('2026-11-04T12:00:00.000Z');

describe('isValidTimeOffPeriod', () => {
  it('should accept a period entirely in the future', () => {
    expect(
      isValidTimeOffPeriod(
        new Date('2026-12-20T00:00:00.000Z'),
        new Date('2027-01-05T00:00:00.000Z'),
        NOW,
      ),
    ).toBe(true);
  });

  it('should accept a period already in progress', () => {
    expect(
      isValidTimeOffPeriod(
        new Date('2026-11-04T08:00:00.000Z'),
        new Date('2026-11-04T18:00:00.000Z'),
        NOW,
      ),
    ).toBe(true);
  });

  it('should not allow a period that has already ended', () => {
    expect(
      isValidTimeOffPeriod(
        new Date('2026-11-01T00:00:00.000Z'),
        new Date('2026-11-04T12:00:00.000Z'),
        NOW,
      ),
    ).toBe(false);
  });

  it('should not allow a period that ends before it starts', () => {
    expect(
      isValidTimeOffPeriod(
        new Date('2026-12-10T00:00:00.000Z'),
        new Date('2026-12-09T00:00:00.000Z'),
        NOW,
      ),
    ).toBe(false);
  });

  it('should not allow an empty period', () => {
    const instant = new Date('2026-12-10T00:00:00.000Z');

    expect(isValidTimeOffPeriod(instant, instant, NOW)).toBe(false);
  });
});
