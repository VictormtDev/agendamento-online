import { describe, expect, it } from 'vitest';
import { stripDays } from './day-strip';

describe('stripDays', () => {
  it('should list seven consecutive days from the start', () => {
    expect(stripDays('2026-02-26', 'America/Sao_Paulo')).toEqual([
      '2026-02-26',
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
    ]);
  });

  it('should not skip or repeat a day across a daylight saving change', () => {
    expect(stripDays('2026-03-07', 'America/New_York')).toEqual([
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
    ]);
  });
});
