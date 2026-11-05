import { DomainError } from './domain-error.js';

export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';

  constructor() {
    super('Usuário não encontrado');
  }
}
