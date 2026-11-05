import type { Service } from '../../domain/entities/service.js';

export type CreateServiceData = Pick<
  Service,
  'providerId' | 'name' | 'durationMinutes' | 'priceCents'
>;

export type ServiceChanges = Partial<
  Pick<Service, 'name' | 'durationMinutes' | 'priceCents' | 'active'>
>;

export interface ServiceRepository {
  /** Returns null both when the service does not exist and when it belongs to another provider. */
  findByIdAndProvider(id: string, providerId: string): Promise<Service | null>;
  /** Ordered by name. */
  listActiveByProvider(providerId: string): Promise<Service[]>;
  create(data: CreateServiceData): Promise<Service>;
  update(id: string, changes: ServiceChanges): Promise<Service>;
}
