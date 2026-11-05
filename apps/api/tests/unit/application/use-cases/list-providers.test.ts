import { beforeEach, describe, expect, it } from 'vitest';
import { ListProviders } from '../../../../src/application/use-cases/list-providers.js';
import type { Role } from '../../../../src/domain/entities/user.js';
import { InMemoryServiceRepository } from '../../../in-memory/in-memory-service-repository.js';
import { InMemoryUserRepository } from '../../../in-memory/in-memory-user-repository.js';

describe('ListProviders', () => {
  let serviceRepository: InMemoryServiceRepository;
  let userRepository: InMemoryUserRepository;
  let listProviders: ListProviders;

  async function createUser(name: string, role: Role = 'PROVIDER') {
    return userRepository.create({
      name,
      email: `${name.toLowerCase()}@example.com`,
      passwordHash: 'hashed:secret123',
      role,
      timezone: 'America/Sao_Paulo',
    });
  }

  async function createService(providerId: string) {
    return serviceRepository.create({
      providerId,
      name: 'Corte',
      durationMinutes: 30,
      priceCents: 5000,
    });
  }

  beforeEach(() => {
    serviceRepository = new InMemoryServiceRepository();
    userRepository = new InMemoryUserRepository(serviceRepository);
    listProviders = new ListProviders(userRepository);
  });

  it('should list providers by name with their active service count', async () => {
    const bruno = await createUser('Bruno');
    const ana = await createUser('Ana');
    await createService(bruno.id);
    await createService(ana.id);
    const inactive = await createService(ana.id);
    inactive.active = false;
    await createService(ana.id);

    const page = await listProviders.execute({ page: 1, perPage: 20 });

    expect(page.data).toEqual([
      { id: ana.id, name: 'Ana', activeServiceCount: 2 },
      { id: bruno.id, name: 'Bruno', activeServiceCount: 1 },
    ]);
    expect(page.meta).toEqual({ page: 1, perPage: 20, total: 2 });
  });

  it('should leave out providers without an active service and clients', async () => {
    await createUser('Sem Servicos');
    const onlyInactive = await createUser('So Inativos');
    const service = await createService(onlyInactive.id);
    service.active = false;
    const client = await createUser('Cliente', 'CLIENT');
    await createService(client.id);

    const page = await listProviders.execute({ page: 1, perPage: 20 });

    expect(page.data).toEqual([]);
  });

  it('should paginate, keeping the total of all bookable providers', async () => {
    for (const name of ['Ana', 'Bruno', 'Carla']) {
      const provider = await createUser(name);
      await createService(provider.id);
    }

    const page = await listProviders.execute({ page: 2, perPage: 2 });

    expect(page.data.map((item) => item.name)).toEqual(['Carla']);
    expect(page.meta).toEqual({ page: 2, perPage: 2, total: 3 });
  });
});
