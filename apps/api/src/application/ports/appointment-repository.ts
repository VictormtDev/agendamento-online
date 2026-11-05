import type { Appointment, AppointmentStatus } from '../../domain/entities/appointment.js';
import type { Service } from '../../domain/entities/service.js';
import type { User } from '../../domain/entities/user.js';
import type { TimeInterval } from '../../domain/services/calculate-available-slots.js';
import type { Pagination } from '../pagination.js';

export type CreateAppointmentData = Pick<
  Appointment,
  'providerId' | 'clientId' | 'serviceId' | 'startsAt' | 'endsAt'
>;

// Read models for listings: each side sees just enough of the other to render the
// list in one request. The client email is left out on purpose (not needed, personal).
export type ServiceSummary = Pick<Service, 'id' | 'name' | 'durationMinutes' | 'priceCents'>;

export interface ClientAppointmentView extends Appointment {
  service: ServiceSummary;
  provider: Pick<User, 'id' | 'name' | 'timezone'>;
}

export interface ProviderAppointmentView extends Appointment {
  service: ServiceSummary;
  client: Pick<User, 'id' | 'name'>;
}

export interface ClientAppointmentsQuery extends Pagination {
  clientId: string;
  status?: AppointmentStatus;
}

export interface ProviderAppointmentsQuery {
  providerId: string;
  interval: TimeInterval;
  status?: AppointmentStatus;
}

export interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  /** SCHEDULED appointments of the provider that intersect the interval; touching does not count. */
  findScheduledOverlapping(providerId: string, interval: TimeInterval): Promise<Appointment[]>;
  /** Newest start first. */
  listByClient(
    query: ClientAppointmentsQuery,
  ): Promise<{ items: ClientAppointmentView[]; total: number }>;
  /** Appointments intersecting the interval, in chronological order. */
  listByProvider(query: ProviderAppointmentsQuery): Promise<ProviderAppointmentView[]>;
  /** @throws SlotUnavailableError when it would overlap a SCHEDULED one, even under concurrent inserts. */
  create(data: CreateAppointmentData): Promise<Appointment>;
  cancel(id: string, canceledAt: Date): Promise<Appointment>;
}
