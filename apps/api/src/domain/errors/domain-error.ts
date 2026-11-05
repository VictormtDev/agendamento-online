// Base for business rule violations. The HTTP status for each `code` is decided
// only in the error handler, so the domain stays unaware of transport details.
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
