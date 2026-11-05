import { DomainError } from './domain-error.js';

export class ProviderNotFoundError extends DomainError {
  readonly code = 'PROVIDER_NOT_FOUND';

  constructor() {
    super('Profissional não encontrado');
  }
}
