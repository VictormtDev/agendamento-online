import { MAX_BOOKING_WINDOW_DAYS } from '../scheduling-rules.js';
import { DomainError } from './domain-error.js';

export class BookingTooFarAheadError extends DomainError {
  readonly code = 'BOOKING_TOO_FAR_AHEAD';

  constructor() {
    super(
      `Agendamentos podem ser feitos com até ${String(MAX_BOOKING_WINDOW_DAYS)} dias de antecedência`,
    );
  }
}
