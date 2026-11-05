import { DomainError } from './domain-error.js';

export class TimeOffNotFoundError extends DomainError {
  readonly code = 'TIME_OFF_NOT_FOUND';

  constructor() {
    super('Folga não encontrada');
  }
}
