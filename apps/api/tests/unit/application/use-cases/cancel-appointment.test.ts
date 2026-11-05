import { beforeEach, describe, expect, it } from 'vitest';
import { CancelAppointment } from '../../../../src/application/use-cases/cancel-appointment.js';
import type { Appointment } from '../../../../src/domain/entities/appointment.js';
import { AppointmentAlreadyCanceledError } from '../../../../src/domain/errors/appointment-already-canceled-error.js';
import { AppointmentAlreadyStartedError } from '../../../../src/domain/errors/appointment-already-started-error.js';
import { AppointmentNotFoundError } from '../../../../src/domain/errors/appointment-not-found-error.js';
import { CancellationDeadlinePassedError } from '../../../../src/domain/errors/cancellation-deadline-passed-error.js';
import { FakeClock } from '../../../fakes/fake-clock.js';
import { InMemoryAppointmentRepository } from '../../../in-memory/in-memory-appointment-repository.js';

const STARTS_AT = new Date('2026-11-10T12:00:00.000Z');

describe('CancelAppointment', () => {
  let appointmentRepository: InMemoryAppointmentRepository;
  let clock: FakeClock;
  let cancelAppointment: CancelAppointment;
  let appointment: Appointment;

  beforeEach(async () => {
    appointmentRepository = new InMemoryAppointmentRepository();
    clock = new FakeClock(new Date('2026-11-05T12:00:00.000Z'));
    cancelAppointment = new CancelAppointment(appointmentRepository, clock);
    appointment = await appointmentRepository.create({
      providerId: 'provider-1',
      clientId: 'client-1',
      serviceId: 'service-1',
      startsAt: STARTS_AT,
      endsAt: new Date('2026-11-10T13:00:00.000Z'),
    });
  });

  function cancelAs(requesterId: string) {
    return cancelAppointment.execute({ appointmentId: appointment.id, requesterId });
  }

  describe('client', () => {
    it('should cancel more than 24 hours before the start, recording when', async () => {
      const canceled = await cancelAs('client-1');

      expect(canceled).toMatchObject({
        status: 'CANCELED',
        canceledAt: new Date('2026-11-05T12:00:00.000Z'),
      });
    });

    it('should cancel exactly 24 hours before the start', async () => {
      clock.set(new Date('2026-11-09T12:00:00.000Z'));

      await expect(cancelAs('client-1')).resolves.toMatchObject({ status: 'CANCELED' });
    });

    it('should not allow the client to cancel less than 24 hours before the start', async () => {
      clock.set(new Date('2026-11-09T12:01:00.000Z'));

      await expect(cancelAs('client-1')).rejects.toBeInstanceOf(CancellationDeadlinePassedError);
      expect(appointment.status).toBe('SCHEDULED');
    });
  });

  describe('provider', () => {
    it('should let the provider cancel at any time before the start', async () => {
      clock.set(new Date('2026-11-10T11:59:00.000Z'));

      await expect(cancelAs('provider-1')).resolves.toMatchObject({ status: 'CANCELED' });
    });
  });

  it('should not allow anyone to cancel an appointment that has already started', async () => {
    clock.set(STARTS_AT);

    await expect(cancelAs('provider-1')).rejects.toBeInstanceOf(AppointmentAlreadyStartedError);
  });

  it('should not cancel twice, keeping the original cancellation time', async () => {
    await cancelAs('client-1');
    clock.set(new Date('2026-11-06T12:00:00.000Z'));

    await expect(cancelAs('provider-1')).rejects.toBeInstanceOf(AppointmentAlreadyCanceledError);
    expect(appointment.canceledAt).toEqual(new Date('2026-11-05T12:00:00.000Z'));
  });

  it('should treat a user who is neither client nor provider as not found', async () => {
    await expect(cancelAs('stranger')).rejects.toBeInstanceOf(AppointmentNotFoundError);
    expect(appointment.status).toBe('SCHEDULED');
  });

  it('should fail for an unknown appointment', async () => {
    await expect(
      cancelAppointment.execute({ appointmentId: 'missing', requesterId: 'client-1' }),
    ).rejects.toBeInstanceOf(AppointmentNotFoundError);
  });
});
