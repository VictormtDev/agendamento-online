import { describe, expect, it } from 'vitest';
import { isValidServiceDuration } from '../../../../src/domain/entities/service.js';

describe('isValidServiceDuration', () => {
  it.each([15, 30, 45, 60, 90, 480])('should accept %i minutes', (minutes) => {
    expect(isValidServiceDuration(minutes)).toBe(true);
  });

  it('should not allow durations off the 15-minute slot grid', () => {
    expect(isValidServiceDuration(50)).toBe(false);
  });

  it('should not allow durations shorter than 15 minutes', () => {
    expect(isValidServiceDuration(0)).toBe(false);
    expect(isValidServiceDuration(-15)).toBe(false);
  });

  it('should not allow durations longer than 8 hours', () => {
    expect(isValidServiceDuration(495)).toBe(false);
  });

  it('should not allow fractional minutes', () => {
    expect(isValidServiceDuration(15.5)).toBe(false);
  });
});
