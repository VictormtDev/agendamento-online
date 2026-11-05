import { describe, expect, it } from 'vitest';
import { formatDuration, formatPrice } from './format';

describe('formatPrice', () => {
  it.each([
    [4550, 'R$ 45,50'],
    [0, 'R$ 0,00'],
    [123456, 'R$ 1.234,56'],
  ])('should format %i cents as %s', (cents, expected) => {
    // Intl separates the symbol with a non-breaking space.
    expect(formatPrice(cents).replace(/\s/u, ' ')).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [15, '15 min'],
    [60, '1 h'],
    [90, '1 h 30 min'],
    [480, '8 h'],
  ])('should format %i minutes as %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
