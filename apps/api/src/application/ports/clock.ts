// Business rules ask the clock instead of calling new Date(), so tests can pin "now".
export interface Clock {
  now(): Date;
}
