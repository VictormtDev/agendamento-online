import type { Availability } from '../../domain/entities/availability.js';
import type { AvailabilityRepository } from '../ports/availability-repository.js';

export interface GetAvailabilityInput {
  providerId: string;
}

export class GetAvailability {
  constructor(private readonly availabilityRepository: AvailabilityRepository) {}

  execute({ providerId }: GetAvailabilityInput): Promise<Availability[]> {
    return this.availabilityRepository.findByProvider(providerId);
  }
}
