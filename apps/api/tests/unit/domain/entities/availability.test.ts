import { describe, expect, it } from 'vitest';
import {
  hasOverlappingWindows,
  isChronologicalWindow,
  isValidTimeOfDay,
} from '../../../../src/domain/entities/availability.js';

describe('isValidTimeOfDay', () => {
  it.each(['00:00', '09:00', '12:15', '18:30', '23:45'])('should accept %s', (time) => {
    expect(isValidTimeOfDay(time)).toBe(true);
  });

  it('should not allow times off the 15-minute slot grid', () => {
    expect(isValidTimeOfDay('09:10')).toBe(false);
  });

  it.each(['9:00', '24:00', '12:60', '09:00:00', 'nove horas', ''])(
    'should reject the malformed time %j',
    (time) => {
      expect(isValidTimeOfDay(time)).toBe(false);
    },
  );
});

describe('isChronologicalWindow', () => {
  it('should accept a window that ends after it starts', () => {
    expect(isChronologicalWindow({ weekday: 1, startTime: '09:00', endTime: '18:00' })).toBe(true);
  });

  it('should not allow a window that crosses midnight', () => {
    expect(isChronologicalWindow({ weekday: 1, startTime: '22:00', endTime: '02:00' })).toBe(false);
  });

  it('should not allow an empty window', () => {
    expect(isChronologicalWindow({ weekday: 1, startTime: '09:00', endTime: '09:00' })).toBe(false);
  });
});

describe('hasOverlappingWindows', () => {
  it('should allow several windows on the same day, such as a lunch break', () => {
    const windows = [
      { weekday: 1, startTime: '14:00', endTime: '18:00' },
      { weekday: 1, startTime: '09:00', endTime: '12:00' },
    ];

    expect(hasOverlappingWindows(windows)).toBe(false);
  });

  it('should allow windows that only touch each other', () => {
    const windows = [
      { weekday: 1, startTime: '09:00', endTime: '12:00' },
      { weekday: 1, startTime: '12:00', endTime: '18:00' },
    ];

    expect(hasOverlappingWindows(windows)).toBe(false);
  });

  it('should detect overlapping windows on the same day, regardless of input order', () => {
    const windows = [
      { weekday: 2, startTime: '11:00', endTime: '15:00' },
      { weekday: 2, startTime: '09:00', endTime: '12:00' },
    ];

    expect(hasOverlappingWindows(windows)).toBe(true);
  });

  it('should detect a window fully contained in another', () => {
    const windows = [
      { weekday: 3, startTime: '09:00', endTime: '18:00' },
      { weekday: 3, startTime: '10:00', endTime: '11:00' },
    ];

    expect(hasOverlappingWindows(windows)).toBe(true);
  });

  it('should not compare windows of different days', () => {
    const windows = [
      { weekday: 1, startTime: '09:00', endTime: '18:00' },
      { weekday: 2, startTime: '09:00', endTime: '18:00' },
    ];

    expect(hasOverlappingWindows(windows)).toBe(false);
  });

  it('should accept an empty grid', () => {
    expect(hasOverlappingWindows([])).toBe(false);
  });
});
