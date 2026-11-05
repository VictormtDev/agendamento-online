import { beforeEach, describe, expect, it } from 'vitest';
import { GetProviderProfile } from '../../../../src/application/use-cases/get-provider-profile.js';
import { ProviderNotFoundError } from '../../../../src/domain/errors/provider-not-found-error.js';
import { createAgendaFixture } from '../../../fakes/create-agenda-fixture.js';

describe('GetProviderProfile', () => {
  let fixture: Awaited<ReturnType<typeof createAgendaFixture>>;
  let getProviderProfile: GetProviderProfile;

  beforeEach(async () => {
    fixture = await createAgendaFixture();
    const { userRepository, serviceRepository } = fixture.repositories;
    getProviderProfile = new GetProviderProfile(userRepository, serviceRepository);
  });

  it('should return the provider with the active services ordered by name', async () => {
    const { serviceRepository } = fixture.repositories;
    const barba = await serviceRepository.create({
      providerId: fixture.provider.id,
      name: 'Barba',
      durationMinutes: 30,
      priceCents: 3000,
    });
    const inactive = await serviceRepository.create({
      providerId: fixture.provider.id,
      name: 'Antigo',
      durationMinutes: 30,
      priceCents: 1000,
    });
    inactive.active = false;

    const output = await getProviderProfile.execute({ providerId: fixture.provider.id });

    expect(output.provider).toEqual({
      id: fixture.provider.id,
      name: 'Bruno Lima',
      timezone: 'America/Sao_Paulo',
    });
    expect(output.services.map((service) => service.id)).toEqual([barba.id, fixture.service.id]);
  });

  it('should throw ProviderNotFoundError for an unknown id', async () => {
    await expect(
      getProviderProfile.execute({ providerId: '01970000-0000-7000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ProviderNotFoundError);
  });

  it('should throw ProviderNotFoundError for a client id', async () => {
    await expect(
      getProviderProfile.execute({ providerId: fixture.client.id }),
    ).rejects.toBeInstanceOf(ProviderNotFoundError);
  });
});
