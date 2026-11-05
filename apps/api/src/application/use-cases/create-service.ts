import type { Service } from '../../domain/entities/service.js';
import type { CreateServiceData, ServiceRepository } from '../ports/service-repository.js';

export type CreateServiceInput = CreateServiceData;

export class CreateService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  execute(input: CreateServiceInput): Promise<Service> {
    return this.serviceRepository.create(input);
  }
}
