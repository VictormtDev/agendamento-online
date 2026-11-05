import { ServiceNotFoundError } from '../../domain/errors/service-not-found-error.js';
import type { ServiceRepository } from '../ports/service-repository.js';

export interface DeleteServiceInput {
  providerId: string;
  serviceId: string;
}

// Soft delete: appointments will reference services, and removing the row would
// erase what was booked. An inactive service just stops accepting new bookings.
export class DeleteService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(input: DeleteServiceInput): Promise<void> {
    const service = await this.serviceRepository.findByIdAndProvider(
      input.serviceId,
      input.providerId,
    );
    if (!service) {
      throw new ServiceNotFoundError();
    }
    await this.serviceRepository.update(service.id, { active: false });
  }
}
