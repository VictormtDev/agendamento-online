import { beforeEach, describe, expect, it } from 'vitest';
import { CreateAppointment } from '../../../../src/application/use-cases/create-appointment.js';
import { BookingTooFarAheadError } from '../../../../src/domain/errors/booking-too-far-ahead-error.js';
import { BookingTooSoonError } from '../../../../src/domain/errors/booking-too-soon-error.js';
import { ProviderNotFoundError } from '../../../../src/domain/errors/provider-not-found-error.js';
import { SelfBookingNotAllowedError } from '../../../../src/domain/errors/self-booking-not-allowed-error.js';
import { ServiceNotFoundError } from '../../../../src/domain/errors/service-not-found-error.js';
import { SlotUnavailableError } from '../../../../src/domain/errors/slot-unavailable-error.js';
import { createAgendaFixture } from '../../../fakes/create-agenda-fixture.js';

// The fixture provider works Thursday 2026-11-05 from 12:00 to 14:00 UTC; "now" is
// Wednesday 2026-11-04 12:00 UTC.
const FREE_START = new Date('2026-11-05T12:00:00.000Z');

describe('CreateAppointment', () => {
  let fixture: Awaited<ReturnType<typeof createAgendaFixture>>;
  let createAppointment: CreateAppointment;

  beforeEach(async () => {
    fixture = await createAgendaFixture();
    createAppointment = new CreateAppointment(fixture.repositories, fixture.clock);
  });

  function book(overrides: Partial<Parameters<CreateAppointment['execute']>[0]> = {}) {
    return createAppointment.execute({
      clientId: fixture.client.id,
      providerId: fixture.provider.id,
      serviceId: fixture.service.id,
      startsAt: FREE_START,
      ...overrides,
    });
  }

  it('should book a free slot, deriving the end from the service duration', async () => {
    const appointment = await book();

    expect(appointment).toMatchObject({
      clientId: fixture.client.id,
      providerId: fixture.provider.id,
      serviceId: fixture.service.id,
      startsAt: FREE_START,
      endsAt: new Date('2026-11-05T13:00:00.000Z'),
      status: 'SCHEDULED',
      canceledAt: null,
    });
    expect(fixture.repositories.appointmentRepository.items).toHaveLength(1);
  });

  it('should let a provider book with another provider', async () => {
    const otherProvider = await fixture.repositories.userRepository.create({
      name: 'Diego Reis',
      email: 'diego@example.com',
      passwordHash: 'hashed:secret123',
      role: 'PROVIDER',
      timezone: 'America/Sao_Paulo',
    });

    await expect(book({ clientId: otherProvider.id })).resolves.toMatchObject({
      clientId: otherProvider.id,
    });
  });

  it('should not allow a provider to book with themselves', async () => {
    await expect(book({ clientId: fixture.provider.id })).rejects.toBeInstanceOf(
      SelfBookingNotAllowedError,
    );
  });

  describe('booking notice and window', () => {
    it('should not allow booking less than 2 hours in advance', async () => {
      fixture.clock.set(new Date('2026-11-05T10:01:00.000Z'));

      await expect(book()).rejects.toBeInstanceOf(BookingTooSoonError);
    });

    it('should allow booking exactly 2 hours in advance', async () => {
      fixture.clock.set(new Date('2026-11-05T10:00:00.000Z'));

      await expect(book()).resolves.toBeDefined();
    });

    it('should not allow booking in the past', async () => {
      fixture.clock.set(new Date('2026-11-06T00:00:00.000Z'));

      await expect(book()).rejects.toBeInstanceOf(BookingTooSoonError);
    });

    it('should not allow booking more than 60 days ahead', async () => {
      fixture.clock.set(new Date('2026-09-06T11:59:00.000Z'));

      await expect(book()).rejects.toBeInstanceOf(BookingTooFarAheadError);
    });
  });

  describe('slot availability', () => {
    it('should not allow booking outside the weekly availability', async () => {
      await expect(book({ startsAt: new Date('2026-11-05T15:00:00.000Z') })).rejects.toBeInstanceOf(
        SlotUnavailableError,
      );
    });

    it('should not allow a booking that would end after the window closes', async () => {
      // 13:30 UTC is inside the window, but the one-hour service would run until 14:30.
      await expect(book({ startsAt: new Date('2026-11-05T13:30:00.000Z') })).rejects.toBeInstanceOf(
        SlotUnavailableError,
      );
    });

    it('should not allow a start off the 15-minute grid', async () => {
      await expect(book({ startsAt: new Date('2026-11-05T12:10:00.000Z') })).rejects.toBeInstanceOf(
        SlotUnavailableError,
      );
    });

    it('should not allow booking during a time off', async () => {
      await fixture.repositories.timeOffRepository.create({
        providerId: fixture.provider.id,
        startsAt: new Date('2026-11-05T00:00:00.000Z'),
        endsAt: new Date('2026-11-06T00:00:00.000Z'),
        reason: 'Folga',
      });

      await expect(book()).rejects.toBeInstanceOf(SlotUnavailableError);
    });

    it('should not allow overlapping a scheduled appointment of the provider', async () => {
      await book();

      await expect(book({ startsAt: new Date('2026-11-05T12:30:00.000Z') })).rejects.toBeInstanceOf(
        SlotUnavailableError,
      );
    });

    it('should allow a booking right after another one ends', async () => {
      await book();

      await expect(book({ startsAt: new Date('2026-11-05T13:00:00.000Z') })).resolves.toBeDefined();
    });

    it('should allow booking a slot freed by a cancellation', async () => {
      const first = await book();
      first.status = 'CANCELED';

      await expect(book()).resolves.toBeDefined();
    });
  });

  describe('provider and service', () => {
    it('should fail for an unknown provider', async () => {
      await expect(book({ providerId: 'missing' })).rejects.toBeInstanceOf(ProviderNotFoundError);
    });

    it('should not allow booking an inactive service', async () => {
      await fixture.repositories.serviceRepository.update(fixture.service.id, { active: false });

      await expect(book()).rejects.toBeInstanceOf(ServiceNotFoundError);
    });
  });
});
