import type { Service } from '../domain/entities/service.js';
import type { User } from '../domain/entities/user.js';
import { ProviderNotFoundError } from '../domain/errors/provider-not-found-error.js';
import { ServiceNotFoundError } from '../domain/errors/service-not-found-error.js';
import {
  calculateAvailableSlots,
  getDayInterval,
  type TimeInterval,
} from '../domain/services/calculate-available-slots.js';
import type { AppointmentRepository } from './ports/appointment-repository.js';
import type { AvailabilityRepository } from './ports/availability-repository.js';
import type { ServiceRepository } from './ports/service-repository.js';
import type { TimeOffRepository } from './ports/time-off-repository.js';
import type { UserRepository } from './ports/user-repository.js';

// Shared by GetAvailableSlots and CreateAppointment. Booking accepts exactly the slots
// listing offers because both go through this single path: the app can never show a
// time it will then refuse, nor accept one it would not show.

export interface AgendaRepositories {
  userRepository: UserRepository;
  serviceRepository: ServiceRepository;
  availabilityRepository: AvailabilityRepository;
  timeOffRepository: TimeOffRepository;
  appointmentRepository: AppointmentRepository;
}

export interface BookableService {
  provider: User;
  service: Service;
}

export async function findBookableService(
  repositories: AgendaRepositories,
  providerId: string,
  serviceId: string,
): Promise<BookableService> {
  // A client id is answered like an unknown id: clients have no agenda.
  const provider = await repositories.userRepository.findById(providerId);
  if (provider?.role !== 'PROVIDER') {
    throw new ProviderNotFoundError();
  }

  // An inactive service accepts no new bookings, so it is treated as missing.
  const service = await repositories.serviceRepository.findByIdAndProvider(serviceId, providerId);
  if (!service?.active) {
    throw new ServiceNotFoundError();
  }

  return { provider, service };
}

export async function listFreeSlots(
  repositories: AgendaRepositories,
  { provider, service }: BookableService,
  date: string,
  now: Date,
): Promise<TimeInterval[]> {
  const day = getDayInterval(date, provider.timezone);
  const [availability, timeOffs, appointments] = await Promise.all([
    repositories.availabilityRepository.findByProvider(provider.id),
    repositories.timeOffRepository.findOverlapping(provider.id, day),
    repositories.appointmentRepository.findScheduledOverlapping(provider.id, day),
  ]);

  return calculateAvailableSlots({
    date,
    timezone: provider.timezone,
    serviceDurationMinutes: service.durationMinutes,
    availability,
    blocked: [...timeOffs, ...appointments].map((item) => ({
      start: item.startsAt,
      end: item.endsAt,
    })),
    now,
  });
}
