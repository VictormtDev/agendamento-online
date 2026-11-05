import { MIN_BOOKING_NOTICE_HOURS } from '../scheduling-rules.js';
import { DomainError } from './domain-error.js';

export class BookingTooSoonError extends DomainError {
  readonly code = 'BOOKING_TOO_SOON';

  constructor() {
    super(
      `Agendamentos precisam de pelo menos ${String(MIN_BOOKING_NOTICE_HOURS)} horas de antecedência`,
    );
  }
}
