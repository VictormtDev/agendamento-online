import { addDays, addHours } from 'date-fns';
import type { Appointment } from '../../domain/entities/appointment.js';
import { BookingTooFarAheadError } from '../../domain/errors/booking-too-far-ahead-error.js';
import { BookingTooSoonError } from '../../domain/errors/booking-too-soon-error.js';
import { SelfBookingNotAllowedError } from '../../domain/errors/self-booking-not-allowed-error.js';
import { SlotUnavailableError } from '../../domain/errors/slot-unavailable-error.js';
import {
  MAX_BOOKING_WINDOW_DAYS,
  MIN_BOOKING_NOTICE_HOURS,
} from '../../domain/scheduling-rules.js';
import { toCalendarDate } from '../../domain/services/calculate-available-slots.js';
import { findBookableService, listFreeSlots, type AgendaRepositories } from '../agenda.js';
import type { Clock } from '../ports/clock.js';

export interface CreateAppointmentInput {
  clientId: string;
  providerId: string;
  serviceId: string;
  startsAt: Date;
}

export class CreateAppointment {
  constructor(
    private readonly repositories: AgendaRepositories,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    const bookable = await findBookableService(
      this.repositories,
      input.providerId,
      input.serviceId,
    );
    if (input.clientId === input.providerId) {
      throw new SelfBookingNotAllowedError();
    }

    // Slot listing would also reject these, but a specific reason lets the client
    // explain to the user what to change, instead of a generic "unavailable".
    const now = this.clock.now();
    if (input.startsAt < addHours(now, MIN_BOOKING_NOTICE_HOURS)) {
      throw new BookingTooSoonError();
    }
    if (input.startsAt > addDays(now, MAX_BOOKING_WINDOW_DAYS)) {
      throw new BookingTooFarAheadError();
    }

    const date = toCalendarDate(input.startsAt, bookable.provider.timezone);
    const freeSlots = await listFreeSlots(this.repositories, bookable, date, now);
    const slot = freeSlots.find((item) => item.start.getTime() === input.startsAt.getTime());
    if (!slot) {
      throw new SlotUnavailableError();
    }

    // The use case check gives a friendly error; under concurrent requests the
    // database exclusion constraint is the final guard against double booking.
    return this.repositories.appointmentRepository.create({
      providerId: input.providerId,
      clientId: input.clientId,
      serviceId: input.serviceId,
      startsAt: slot.start,
      endsAt: slot.end,
    });
  }
}
