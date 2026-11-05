import { TimeOffNotFoundError } from '../../domain/errors/time-off-not-found-error.js';
import type { TimeOffRepository } from '../ports/time-off-repository.js';

export interface DeleteTimeOffInput {
  providerId: string;
  timeOffId: string;
}

// Hard delete, unlike services: nothing references a time off, so there is no history to keep.
export class DeleteTimeOff {
  constructor(private readonly timeOffRepository: TimeOffRepository) {}

  async execute(input: DeleteTimeOffInput): Promise<void> {
    const timeOff = await this.timeOffRepository.findByIdAndProvider(
      input.timeOffId,
      input.providerId,
    );
    if (!timeOff) {
      throw new TimeOffNotFoundError();
    }
    await this.timeOffRepository.delete(timeOff.id);
  }
}
