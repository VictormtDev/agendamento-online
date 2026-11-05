import { DomainError } from './domain-error.js';

export class InvalidTimeOffPeriodError extends DomainError {
  readonly code = 'INVALID_TIME_OFF_PERIOD';

  constructor() {
    super('O fim da folga deve ser depois do início e no futuro');
  }
}
