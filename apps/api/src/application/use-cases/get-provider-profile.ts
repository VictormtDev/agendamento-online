import type { Service } from '../../domain/entities/service.js';
import { ProviderNotFoundError } from '../../domain/errors/provider-not-found-error.js';
import type { ServiceRepository } from '../ports/service-repository.js';
import type { UserRepository } from '../ports/user-repository.js';

export interface GetProviderProfileInput {
  providerId: string;
}

export interface GetProviderProfileOutput {
  provider: { id: string; name: string; timezone: string };
  services: Service[];
}

export class GetProviderProfile {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly serviceRepository: ServiceRepository,
  ) {}

  async execute({ providerId }: GetProviderProfileInput): Promise<GetProviderProfileOutput> {
    // A client id is answered like an unknown id: clients have no public profile.
    const provider = await this.userRepository.findById(providerId);
    if (provider?.role !== 'PROVIDER') {
      throw new ProviderNotFoundError();
    }

    const services = await this.serviceRepository.listActiveByProvider(provider.id);
    return {
      provider: { id: provider.id, name: provider.name, timezone: provider.timezone },
      services,
    };
  }
}
