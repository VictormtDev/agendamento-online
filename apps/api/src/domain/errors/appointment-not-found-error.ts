import { DomainError } from './domain-error.js';

export class AppointmentNotFoundError extends DomainError {
  readonly code = 'APPOINTMENT_NOT_FOUND';

  constructor() {
    super('Agendamento não encontrado');
  }
}
