import type { TimeOff } from '../../domain/entities/time-off.js';
import type { Clock } from '../ports/clock.js';
import type { TimeOffRepository } from '../ports/time-off-repository.js';

export interface ListUpcomingTimeOffsInput {
  providerId: string;
}

// Past time offs no longer block anything, so the provider sees only what still matters,
// including one already under way.
export class ListUpcomingTimeOffs {
  constructor(
    private readonly timeOffRepository: TimeOffRepository,
    private readonly clock: Clock,
  ) {}

  execute({ providerId }: ListUpcomingTimeOffsInput): Promise<TimeOff[]> {
    return this.timeOffRepository.listEndingAfter(providerId, this.clock.now());
  }
}
