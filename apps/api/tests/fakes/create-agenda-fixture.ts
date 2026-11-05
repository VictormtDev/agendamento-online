import type { AgendaRepositories } from '../../src/application/agenda.js';
import { InMemoryAppointmentRepository } from '../in-memory/in-memory-appointment-repository.js';
import { InMemoryAvailabilityRepository } from '../in-memory/in-memory-availability-repository.js';
import { InMemoryServiceRepository } from '../in-memory/in-memory-service-repository.js';
import { InMemoryTimeOffRepository } from '../in-memory/in-memory-time-off-repository.js';
import { InMemoryUserRepository } from '../in-memory/in-memory-user-repository.js';
import { FakeClock } from './fake-clock.js';

/** Thursday 2026-11-05, the day the fixture provider works 09:00-11:00 (São Paulo, UTC-3). */
export const FIXTURE_DATE = '2026-11-05';

/**
 * A São Paulo provider with a one-hour service, working Thursdays 09:00-11:00 local
 * (12:00-14:00 UTC). "Now" is the day before, 09:00 local.
 */
export async function createAgendaFixture() {
  const repositories = {
    userRepository: new InMemoryUserRepository(),
    serviceRepository: new InMemoryServiceRepository(),
    availabilityRepository: new InMemoryAvailabilityRepository(),
    timeOffRepository: new InMemoryTimeOffRepository(),
    appointmentRepository: new InMemoryAppointmentRepository(),
  } satisfies AgendaRepositories;
  const clock = new FakeClock(new Date('2026-11-04T12:00:00.000Z'));

  const provider = await repositories.userRepository.create({
    name: 'Bruno Lima',
    email: 'bruno@example.com',
    passwordHash: 'hashed:secret123',
    role: 'PROVIDER',
    timezone: 'America/Sao_Paulo',
  });
  const client = await repositories.userRepository.create({
    name: 'Carla Dias',
    email: 'carla@example.com',
    passwordHash: 'hashed:secret123',
    role: 'CLIENT',
    timezone: 'America/Sao_Paulo',
  });
  const service = await repositories.serviceRepository.create({
    providerId: provider.id,
    name: 'Corte',
    durationMinutes: 60,
    priceCents: 5000,
  });
  await repositories.availabilityRepository.replaceForProvider(provider.id, [
    { weekday: 4, startTime: '09:00', endTime: '11:00' },
  ]);

  return { repositories, clock, provider, client, service };
}
