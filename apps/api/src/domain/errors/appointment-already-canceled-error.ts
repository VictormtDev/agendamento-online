import { DomainError } from './domain-error.js';

export class AppointmentAlreadyCanceledError extends DomainError {
  readonly code = 'APPOINTMENT_ALREADY_CANCELED';

  constructor() {
    super('Este agendamento já foi cancelado');
  }
}
