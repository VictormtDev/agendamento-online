import { CLIENT_CANCELLATION_NOTICE_HOURS } from '../scheduling-rules.js';
import { DomainError } from './domain-error.js';

export class CancellationDeadlinePassedError extends DomainError {
  readonly code = 'CANCELLATION_DEADLINE_PASSED';

  constructor() {
    super(
      `O cliente só pode cancelar até ${String(CLIENT_CANCELLATION_NOTICE_HOURS)} horas antes do início`,
    );
  }
}
