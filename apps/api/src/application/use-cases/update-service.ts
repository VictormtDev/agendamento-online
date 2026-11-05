import type { Service } from '../../domain/entities/service.js';
import { ServiceNotFoundError } from '../../domain/errors/service-not-found-error.js';
import type { ServiceChanges, ServiceRepository } from '../ports/service-repository.js';

export interface UpdateServiceInput {
  providerId: string;
  serviceId: string;
  changes: ServiceChanges;
}

export class UpdateService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(input: UpdateServiceInput): Promise<Service> {
    // Another provider's service is reported as missing, not forbidden: a 403 would
    // confirm to a stranger that the id exists.
    const service = await this.serviceRepository.findByIdAndProvider(
      input.serviceId,
      input.providerId,
    );
    if (!service) {
      throw new ServiceNotFoundError();
    }
    return this.serviceRepository.update(service.id, input.changes);
  }
}
