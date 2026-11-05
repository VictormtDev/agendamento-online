import {
  isWithinClientCancellationDeadline,
  type Appointment,
} from '../../domain/entities/appointment.js';
import { AppointmentAlreadyCanceledError } from '../../domain/errors/appointment-already-canceled-error.js';
import { AppointmentAlreadyStartedError } from '../../domain/errors/appointment-already-started-error.js';
import { AppointmentNotFoundError } from '../../domain/errors/appointment-not-found-error.js';
import { CancellationDeadlinePassedError } from '../../domain/errors/cancellation-deadline-passed-error.js';
import type { AppointmentRepository } from '../ports/appointment-repository.js';
import type { Clock } from '../ports/clock.js';

export interface CancelAppointmentInput {
  appointmentId: string;
  requesterId: string;
}

export class CancelAppointment {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CancelAppointmentInput): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(input.appointmentId);
    const isProvider = appointment?.providerId === input.requesterId;
    const isClient = appointment?.clientId === input.requesterId;
    // Strangers get the same answer as for a missing id, so ids cannot be probed.
    if (!appointment || (!isProvider && !isClient)) {
      throw new AppointmentNotFoundError();
    }

    // Rejected instead of silently succeeding, which would also overwrite canceledAt.
    if (appointment.status === 'CANCELED') {
      throw new AppointmentAlreadyCanceledError();
    }

    // Once started, the appointment either happened or was a no-show; neither is a cancellation.
    const now = this.clock.now();
    if (now >= appointment.startsAt) {
      throw new AppointmentAlreadyStartedError();
    }

    if (isClient && !isWithinClientCancellationDeadline(appointment.startsAt, now)) {
      throw new CancellationDeadlinePassedError();
    }

    return this.appointmentRepository.cancel(appointment.id, now);
  }
}
