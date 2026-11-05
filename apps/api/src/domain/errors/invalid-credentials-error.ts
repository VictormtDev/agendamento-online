import { DomainError } from './domain-error.js';

// Same error for unknown email and wrong password, so the API never reveals which emails exist.
export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('E-mail ou senha inválidos');
  }
}
