import type { Availability, AvailabilityWindow } from '../../domain/entities/availability.js';
import type { AvailabilityRepository } from '../ports/availability-repository.js';

export interface ReplaceAvailabilityInput {
  providerId: string;
  windows: readonly AvailabilityWindow[];
}

// Replacing the whole grid (instead of editing windows one by one) keeps the API
// simple and means the overlap check always sees the complete week.
export class ReplaceAvailability {
  constructor(private readonly availabilityRepository: AvailabilityRepository) {}

  execute(input: ReplaceAvailabilityInput): Promise<Availability[]> {
    return this.availabilityRepository.replaceForProvider(input.providerId, input.windows);
  }
}
