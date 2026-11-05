import { DomainError } from './domain-error.js';

export class SelfBookingNotAllowedError extends DomainError {
  readonly code = 'SELF_BOOKING_NOT_ALLOWED';

  constructor() {
    super('Não é possível agendar um horário consigo mesmo');
  }
}
