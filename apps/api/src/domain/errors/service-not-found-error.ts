import { DomainError } from './domain-error.js';

export class ServiceNotFoundError extends DomainError {
  readonly code = 'SERVICE_NOT_FOUND';

  constructor() {
    super('Serviço não encontrado');
  }
}
