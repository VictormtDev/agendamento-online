import { isValidTimeOffPeriod, type TimeOff } from '../../domain/entities/time-off.js';
import { InvalidTimeOffPeriodError } from '../../domain/errors/invalid-time-off-period-error.js';
import type { Clock } from '../ports/clock.js';
import type { CreateTimeOffData, TimeOffRepository } from '../ports/time-off-repository.js';

export type CreateTimeOffInput = CreateTimeOffData;

export class CreateTimeOff {
  constructor(
    private readonly timeOffRepository: TimeOffRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateTimeOffInput): Promise<TimeOff> {
    if (!isValidTimeOffPeriod(input.startsAt, input.endsAt, this.clock.now())) {
      throw new InvalidTimeOffPeriodError();
    }
    return this.timeOffRepository.create(input);
  }
}
