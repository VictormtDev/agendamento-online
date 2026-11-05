import { describe, expect, it } from 'vitest';
import {
  calculateAvailableSlots,
  getDayInterval,
  type SlotQuery,
} from '../../../../src/domain/services/calculate-available-slots.js';

const SAO_PAULO = 'America/Sao_Paulo'; // UTC-3, no daylight saving
const THURSDAY = 4;

// Wednesday 2026-11-04 09:00 in São Paulo; the queried day is the next one.
const BASE_QUERY: SlotQuery = {
  date: '2026-11-05',
  timezone: SAO_PAULO,
  serviceDurationMinutes: 60,
  availability: [{ weekday: THURSDAY, startTime: '09:00', endTime: '12:00' }],
  blocked: [],
  now: new Date('2026-11-04T12:00:00.000Z'),
};

function startsOf(query: Partial<SlotQuery>): string[] {
  return calculateAvailableSlots({ ...BASE_QUERY, ...query }).map((slot) =>
    slot.start.toISOString(),
  );
}

function utc(hours: string, date = '2026-11-05'): string {
  return new Date(`${date}T${hours}:00.000Z`).toISOString();
}

describe('calculateAvailableSlots', () => {
  describe('grid', () => {
    it('should offer slots every 15 minutes, converted from the provider timezone to UTC', () => {
      expect(startsOf({})).toEqual([
        utc('12:00'),
        utc('12:15'),
        utc('12:30'),
        utc('12:45'),
        utc('13:00'),
        utc('13:15'),
        utc('13:30'),
        utc('13:45'),
        utc('14:00'),
      ]);
    });

    it('should set each slot end to start plus the service duration', () => {
      const [first] = calculateAvailableSlots({ ...BASE_QUERY, serviceDurationMinutes: 45 });

      expect(first).toEqual({
        start: new Date('2026-11-05T12:00:00.000Z'),
        end: new Date('2026-11-05T12:45:00.000Z'),
      });
    });

    it('should not offer a slot that would end after the window closes', () => {
      expect(
        startsOf({
          serviceDurationMinutes: 45,
          availability: [{ weekday: THURSDAY, startTime: '09:00', endTime: '10:00' }],
        }),
      ).toEqual([utc('12:00'), utc('12:15')]);
    });

    it('should offer nothing when the service is longer than the window', () => {
      expect(
        startsOf({
          serviceDurationMinutes: 120,
          availability: [{ weekday: THURSDAY, startTime: '09:00', endTime: '10:00' }],
        }),
      ).toEqual([]);
    });

    it('should not offer slots across a break between two windows', () => {
      const starts = startsOf({
        availability: [
          { weekday: THURSDAY, startTime: '14:00', endTime: '15:00' },
          { weekday: THURSDAY, startTime: '09:00', endTime: '10:00' },
        ],
      });

      expect(starts).toEqual([utc('12:00'), utc('17:00')]);
    });

    it('should treat windows that touch each other as one continuous stretch', () => {
      const starts = startsOf({
        availability: [
          { weekday: THURSDAY, startTime: '09:00', endTime: '10:00' },
          { weekday: THURSDAY, startTime: '10:00', endTime: '11:00' },
        ],
      });

      expect(starts).toEqual([
        utc('12:00'),
        utc('12:15'),
        utc('12:30'),
        utc('12:45'),
        utc('13:00'),
      ]);
    });

    it('should ignore windows of other weekdays', () => {
      expect(
        startsOf({
          availability: [{ weekday: THURSDAY + 1, startTime: '09:00', endTime: '12:00' }],
        }),
      ).toEqual([]);
    });

    it('should use the weekday of the date in the provider timezone, not in UTC', () => {
      // 09:00 on Thursday in Tokyo is still Thursday 00:00 in UTC, and 2026-11-05 is a Thursday there.
      expect(startsOf({ timezone: 'Asia/Tokyo' })[0]).toBe(utc('00:00'));
    });
  });

  describe('booking notice and window', () => {
    it('should not allow booking less than 2 hours in advance', () => {
      // "now" is Thursday 09:00 local, so the first bookable start is 11:00 local.
      const starts = startsOf({
        serviceDurationMinutes: 30,
        now: new Date('2026-11-05T12:00:00.000Z'),
      });

      expect(starts).toEqual([utc('14:00'), utc('14:15'), utc('14:30')]);
    });

    it('should offer nothing for a day in the past', () => {
      expect(startsOf({ now: new Date('2026-11-10T12:00:00.000Z') })).toEqual([]);
    });

    it('should not allow booking more than 60 days ahead', () => {
      // 60 days after Wednesday 2026-11-04 09:00 local is Sunday 2027-01-03 09:00 local.
      const starts = startsOf({
        date: '2027-01-03',
        availability: [{ weekday: 0, startTime: '08:00', endTime: '11:00' }],
      });

      expect(starts).toEqual([
        utc('11:00', '2027-01-03'),
        utc('11:15', '2027-01-03'),
        utc('11:30', '2027-01-03'),
        utc('11:45', '2027-01-03'),
        utc('12:00', '2027-01-03'),
      ]);
    });
  });

  describe('blocked time', () => {
    it('should skip slots that overlap a blocked interval, allowing slots that only touch it', () => {
      const starts = startsOf({
        serviceDurationMinutes: 30,
        blocked: [
          {
            start: new Date('2026-11-05T13:00:00.000Z'),
            end: new Date('2026-11-05T14:00:00.000Z'),
          },
        ],
      });

      expect(starts).toEqual([
        utc('12:00'),
        utc('12:15'),
        utc('12:30'),
        utc('14:00'),
        utc('14:15'),
        utc('14:30'),
      ]);
    });

    it('should offer nothing when a time off covers the whole day', () => {
      expect(
        startsOf({
          blocked: [
            {
              start: new Date('2026-11-01T00:00:00.000Z'),
              end: new Date('2026-11-10T00:00:00.000Z'),
            },
          ],
        }),
      ).toEqual([]);
    });
  });

  describe('daylight saving time', () => {
    const NEW_YORK = 'America/New_York';
    const SUNDAY = 0;

    it('should skip the missing hour when clocks spring forward', () => {
      // On 2026-03-08 New York jumps from 02:00 EST straight to 03:00 EDT, so the
      // 01:00-04:00 window lasts only 2 real hours.
      const starts = startsOf({
        date: '2026-03-08',
        timezone: NEW_YORK,
        availability: [{ weekday: SUNDAY, startTime: '01:00', endTime: '04:00' }],
        now: new Date('2026-03-01T00:00:00.000Z'),
      });

      expect(starts).toEqual([
        utc('06:00', '2026-03-08'),
        utc('06:15', '2026-03-08'),
        utc('06:30', '2026-03-08'),
        utc('06:45', '2026-03-08'),
        utc('07:00', '2026-03-08'),
      ]);
    });

    it('should include the repeated hour when clocks fall back', () => {
      // On 2026-11-01 New York repeats 01:00-02:00, so the 01:00-03:00 window lasts 3 real hours.
      const starts = startsOf({
        date: '2026-11-01',
        timezone: NEW_YORK,
        availability: [{ weekday: SUNDAY, startTime: '01:00', endTime: '03:00' }],
        now: new Date('2026-10-25T00:00:00.000Z'),
      });

      expect(starts).toHaveLength(9);
      expect(starts[0]).toBe(utc('05:00', '2026-11-01'));
      expect(starts.at(-1)).toBe(utc('07:00', '2026-11-01'));
    });
  });
});

describe('getDayInterval', () => {
  it('should cover the calendar day in the given timezone', () => {
    expect(getDayInterval('2026-11-05', SAO_PAULO)).toEqual({
      start: new Date('2026-11-05T03:00:00.000Z'),
      end: new Date('2026-11-06T03:00:00.000Z'),
    });
  });

  it('should be 23 hours long on the day clocks spring forward', () => {
    const { start, end } = getDayInterval('2026-03-08', 'America/New_York');

    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });
});
