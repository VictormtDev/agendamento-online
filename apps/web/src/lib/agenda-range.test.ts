import { describe, expect, it } from 'vitest';
import { agendaRange, calendarDateOf, shiftDate } from './agenda-range';

describe('agendaRange', () => {
  it('should cover one local day in the provider timezone', () => {
    const range = agendaRange('day', '2026-11-05', 'America/Sao_Paulo');

    expect(range.from.toISOString()).toBe('2026-11-05T03:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-11-06T03:00:00.000Z');
    expect(range.days).toEqual(['2026-11-05']);
  });

  it('should cover Monday to Sunday of the week of the date', () => {
    // 2026-11-05 is a Thursday.
    const range = agendaRange('week', '2026-11-05', 'America/Sao_Paulo');

    expect(range.from.toISOString()).toBe('2026-11-02T03:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-11-09T03:00:00.000Z');
    expect(range.days).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
  });

  it('should keep a daylight saving day 25 hours long', () => {
    // New York falls back on 2026-11-01: midnight is UTC-4, the next one UTC-5.
    const range = agendaRange('day', '2026-11-01', 'America/New_York');

    expect(range.from.toISOString()).toBe('2026-11-01T04:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-11-02T05:00:00.000Z');
  });
});

describe('shiftDate', () => {
  it.each([
    ['day', 1, '2026-11-06'],
    ['day', -1, '2026-11-04'],
    ['week', 1, '2026-11-12'],
    ['week', -1, '2026-10-29'],
  ] as const)('should move a %s by %i', (view, direction, expected) => {
    expect(shiftDate(view, '2026-11-05', 'America/Sao_Paulo', direction)).toBe(expected);
  });

  it('should cross a month and a year', () => {
    expect(shiftDate('week', '2026-12-28', 'America/Sao_Paulo', 1)).toBe('2027-01-04');
  });
});

describe('calendarDateOf', () => {
  it('should use the local date, not the UTC one', () => {
    // 01:30 UTC on the 6th is 22:30 of the 5th in São Paulo.
    expect(calendarDateOf('2026-11-06T01:30:00.000Z', 'America/Sao_Paulo')).toBe('2026-11-05');
  });
});
