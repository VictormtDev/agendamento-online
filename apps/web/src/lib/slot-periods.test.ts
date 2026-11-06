import { describe, expect, it } from 'vitest';
import { groupSlotsByPeriod } from './slot-periods';

// São Paulo is UTC-3 all year: 14Z is 11:00, 15Z is 12:00, 21Z is 18:00 there.
const at = (utcHour: string) => ({
  startsAt: `2026-01-15T${utcHour}:00:00.000Z`,
  endsAt: `2026-01-15T${utcHour}:30:00.000Z`,
});

describe('groupSlotsByPeriod', () => {
  it('should split slots into morning, afternoon and evening in the provider timezone', () => {
    const groups = groupSlotsByPeriod([at('14'), at('15'), at('21')], 'America/Sao_Paulo');

    expect(groups.map((group) => [group.period, group.slots.length])).toEqual([
      ['Manhã', 1],
      ['Tarde', 1],
      ['Noite', 1],
    ]);
  });

  it('should omit empty periods', () => {
    const groups = groupSlotsByPeriod([at('12')], 'America/Sao_Paulo');

    expect(groups.map((group) => [group.period, group.slots.length])).toEqual([['Manhã', 1]]);
  });
});
