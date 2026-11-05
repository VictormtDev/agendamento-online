import { DomainError } from './domain-error.js';

export class AppointmentAlreadyStartedError extends DomainError {
  readonly code = 'APPOINTMENT_ALREADY_STARTED';

  constructor() {
    super('Não é possível cancelar um agendamento que já começou');
  }
}
