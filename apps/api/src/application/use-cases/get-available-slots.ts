import type { TimeInterval } from '../../domain/services/calculate-available-slots.js';
import { findBookableService, listFreeSlots, type AgendaRepositories } from '../agenda.js';
import type { Clock } from '../ports/clock.js';

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
    private readonly repositories: AgendaRepositories,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetAvailableSlotsInput): Promise<GetAvailableSlotsOutput> {
    const bookable = await findBookableService(
      this.repositories,
      input.providerId,
      input.serviceId,
    );
    const slots = await listFreeSlots(this.repositories, bookable, input.date, this.clock.now());
    return { timezone: bookable.provider.timezone, slots };
  }
}
