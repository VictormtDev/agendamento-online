import { DomainError } from './domain-error.js';

export class SlotUnavailableError extends DomainError {
  readonly code = 'SLOT_UNAVAILABLE';

  constructor() {
    super('Horário indisponível');
  }
}
