import type { Clock } from '../../src/application/ports/clock.js';

export class FakeClock implements Clock {
  constructor(private current = new Date('2026-11-04T12:00:00.000Z')) {}

  now(): Date {
    return new Date(this.current);
  }

  set(date: Date): void {
    this.current = date;
  }
}
