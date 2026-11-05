import { randomUUID } from 'node:crypto';
import type {
  AppointmentRepository,
  ClientAppointmentsQuery,
  ClientAppointmentView,
  CreateAppointmentData,
  ProviderAppointmentsQuery,
  ProviderAppointmentView,
  ServiceSummary,
} from '../../src/application/ports/appointment-repository.js';
import type { Appointment } from '../../src/domain/entities/appointment.js';
import type { User } from '../../src/domain/entities/user.js';
import { SlotUnavailableError } from '../../src/domain/errors/slot-unavailable-error.js';
import type { TimeInterval } from '../../src/domain/services/calculate-available-slots.js';
import { InMemoryServiceRepository } from './in-memory-service-repository.js';
import { InMemoryUserRepository } from './in-memory-user-repository.js';

// Listings embed the service and the other party, so this repository reads the
// other in-memory repositories the way the real one joins tables.
export class InMemoryAppointmentRepository implements AppointmentRepository {
  readonly items: Appointment[] = [];

  constructor(
    private readonly userRepository = new InMemoryUserRepository(),
    private readonly serviceRepository = new InMemoryServiceRepository(),
  ) {}

  findById(id: string): Promise<Appointment | null> {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  findScheduledOverlapping(providerId: string, interval: TimeInterval): Promise<Appointment[]> {
    return Promise.resolve(
      this.items.filter(
        (item) =>
          item.providerId === providerId &&
          item.status === 'SCHEDULED' &&
          item.startsAt < interval.end &&
          item.endsAt > interval.start,
      ),
    );
  }

  listByClient(
    query: ClientAppointmentsQuery,
  ): Promise<{ items: ClientAppointmentView[]; total: number }> {
    const matching = this.items
      .filter((item) => item.clientId === query.clientId)
      .filter((item) => !query.status || item.status === query.status)
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
    const offset = (query.page - 1) * query.perPage;
    const items = matching.slice(offset, offset + query.perPage).map((item) => {
      const provider = this.userOf(item.providerId);
      return {
        ...item,
        service: this.serviceOf(item.serviceId),
        provider: { id: provider.id, name: provider.name, timezone: provider.timezone },
      };
    });
    return Promise.resolve({ items, total: matching.length });
  }

  listByProvider(query: ProviderAppointmentsQuery): Promise<ProviderAppointmentView[]> {
    const items = this.items
      .filter(
        (item) =>
          item.providerId === query.providerId &&
          item.startsAt < query.interval.end &&
          item.endsAt > query.interval.start &&
          (!query.status || item.status === query.status),
      )
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .map((item) => {
        const client = this.userOf(item.clientId);
        return {
          ...item,
          service: this.serviceOf(item.serviceId),
          client: { id: client.id, name: client.name },
        };
      });
    return Promise.resolve(items);
  }

  // Mirrors the exclusion constraint of the real database, as promised by the port contract.
  create(data: CreateAppointmentData): Promise<Appointment> {
    const overlaps = this.items.some(
      (item) =>
        item.providerId === data.providerId &&
        item.status === 'SCHEDULED' &&
        item.startsAt < data.endsAt &&
        item.endsAt > data.startsAt,
    );
    if (overlaps) {
      return Promise.reject(new SlotUnavailableError());
    }
    const appointment: Appointment = {
      id: randomUUID(),
      status: 'SCHEDULED',
      canceledAt: null,
      createdAt: new Date(),
      ...data,
    };
    this.items.push(appointment);
    return Promise.resolve(appointment);
  }

  cancel(id: string, canceledAt: Date): Promise<Appointment> {
    const appointment = this.items.find((item) => item.id === id);
    if (!appointment) {
      return Promise.reject(new Error(`Appointment ${id} not found`));
    }
    appointment.status = 'CANCELED';
    appointment.canceledAt = canceledAt;
    return Promise.resolve(appointment);
  }

  // Like a foreign key, a dangling reference is a broken test setup, not a valid state.
  private userOf(id: string): User {
    const user = this.userRepository.users.find((item) => item.id === id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    return user;
  }

  private serviceOf(id: string): ServiceSummary {
    const service = this.serviceRepository.services.find((item) => item.id === id);
    if (!service) {
      throw new Error(`Service ${id} not found`);
    }
    return {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
    };
  }
}
