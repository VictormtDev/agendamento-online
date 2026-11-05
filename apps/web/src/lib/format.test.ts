import { describe, expect, it } from 'vitest';
import { formatDateTime, formatDuration, formatPrice, formatTime, todayIn } from './format';

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

describe('todayIn', () => {
  it('should use the calendar date of the timezone, not of UTC', () => {
    // 01:30 UTC on the 6th is still 22:30 of the 5th in São Paulo.
    const now = new Date('2026-11-06T01:30:00.000Z');

    expect(todayIn('America/Sao_Paulo', now)).toBe('2026-11-05');
    expect(todayIn('UTC', now)).toBe('2026-11-06');
  });
});

describe('formatTime and formatDateTime', () => {
  it('should show the instant in the given timezone', () => {
    expect(formatTime('2026-11-12T12:00:00.000Z', 'America/Sao_Paulo')).toBe('09:00');
    expect(formatTime('2026-11-12T12:00:00.000Z', 'Asia/Tokyo')).toBe('21:00');
  });

  it('should write the full date and time in Portuguese', () => {
    expect(formatDateTime('2026-11-12T12:00:00.000Z', 'America/Sao_Paulo')).toBe(
      'quinta-feira, 12 de novembro de 2026 às 09:00',
    );
  });
});
