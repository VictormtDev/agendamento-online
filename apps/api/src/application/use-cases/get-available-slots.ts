import { ProviderNotFoundError } from '../../domain/errors/provider-not-found-error.js';
import { ServiceNotFoundError } from '../../domain/errors/service-not-found-error.js';
import {
  calculateAvailableSlots,
  getDayInterval,
  type TimeInterval,
} from '../../domain/services/calculate-available-slots.js';
import type { AvailabilityRepository } from '../ports/availability-repository.js';
import type { Clock } from '../ports/clock.js';
import type { ServiceRepository } from '../ports/service-repository.js';
import type { TimeOffRepository } from '../ports/time-off-repository.js';
import type { UserRepository } from '../ports/user-repository.js';

export interface GetAvailableSlotsInput {
  providerId: string;
  serviceId: string;
  /** "YYYY-MM-DD", read in the provider timezone. */
  date: string;
}

export interface GetAvailableSlotsOutput {
  timezone: string;
  slots: TimeInterval[];
}

export class GetAvailableSlots {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly timeOffRepository: TimeOffRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetAvailableSlotsInput): Promise<GetAvailableSlotsOutput> {
    // A client id in the URL is answered like an unknown id: clients have no agenda.
    const provider = await this.userRepository.findById(input.providerId);
    if (provider?.role !== 'PROVIDER') {
      throw new ProviderNotFoundError();
    }

    // An inactive service accepts no new bookings, so offering slots for it would be a lie.
    const service = await this.serviceRepository.findByIdAndProvider(
      input.serviceId,
      input.providerId,
    );
    if (!service?.active) {
      throw new ServiceNotFoundError();
    }

    const day = getDayInterval(input.date, provider.timezone);
    const [availability, timeOffs] = await Promise.all([
      this.availabilityRepository.findByProvider(provider.id),
      this.timeOffRepository.findOverlapping(provider.id, day),
    ]);

    const slots = calculateAvailableSlots({
      date: input.date,
      timezone: provider.timezone,
      serviceDurationMinutes: service.durationMinutes,
      availability,
      blocked: timeOffs.map((timeOff) => ({ start: timeOff.startsAt, end: timeOff.endsAt })),
      now: this.clock.now(),
    });
    return { timezone: provider.timezone, slots };
  }
}
