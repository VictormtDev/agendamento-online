import { TZDate } from '@date-fns/tz';
import { addDays, format, startOfDay } from 'date-fns';
import type { Role } from '../src/domain/entities/user.js';
import { env } from '../src/config/env.js';
import { createAppDependencies } from '../src/infra/container.js';
import { prisma } from '../src/infra/database/prisma-client.js';

/** Every demo account uses this domain, so a re-run removes only demo data. */
const DEMO_EMAIL_DOMAIN = '@demo.agendamento';
const DEMO_PASSWORD = 'demo12345';
// Bookings and time offs are placed relative to today, so the demo never goes stale.
const SEARCH_DAYS_FOR_FREE_SLOT = 7;

interface DemoService {
  key: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

interface DemoProvider {
  key: string;
  name: string;
  timezone: string;
  services: DemoService[];
  windows: { weekdays: number[]; startTime: string; endTime: string }[];
  timeOff?: { inDays: number; lengthDays: number; reason: string };
}

const PROVIDERS: DemoProvider[] = [
  {
    key: 'rafael',
    name: 'Rafael Lima',
    timezone: 'America/Sao_Paulo',
    services: [
      { key: 'corte', name: 'Corte de cabelo', durationMinutes: 30, priceCents: 5000 },
      { key: 'barba', name: 'Barba', durationMinutes: 30, priceCents: 3500 },
      { key: 'combo', name: 'Corte + barba', durationMinutes: 60, priceCents: 8000 },
    ],
    windows: [
      { weekdays: [2, 3, 4, 5, 6], startTime: '09:00', endTime: '12:00' },
      { weekdays: [2, 3, 4, 5, 6], startTime: '13:00', endTime: '19:00' },
    ],
    timeOff: { inDays: 10, lengthDays: 3, reason: 'Curso de especialização' },
  },
  {
    key: 'camila',
    name: 'Camila Rocha',
    timezone: 'America/Sao_Paulo',
    services: [
      // Free on purpose: shows that a zero price is valid.
      { key: 'avaliacao', name: 'Avaliação física', durationMinutes: 60, priceCents: 0 },
      { key: 'treino', name: 'Treino individual', durationMinutes: 60, priceCents: 12000 },
      { key: 'dupla', name: 'Treino em dupla', durationMinutes: 60, priceCents: 18000 },
    ],
    windows: [
      { weekdays: [1, 2, 3, 4, 5], startTime: '06:00', endTime: '10:00' },
      { weekdays: [1, 2, 3, 4, 5], startTime: '17:00', endTime: '21:00' },
      { weekdays: [6], startTime: '08:00', endTime: '12:00' },
    ],
  },
  {
    key: 'helena',
    name: 'Helena Costa',
    // Another timezone on purpose: her times are shown as she sees them, one hour behind Brasília.
    timezone: 'America/Manaus',
    services: [
      { key: 'primeira', name: 'Primeira consulta', durationMinutes: 60, priceCents: 10000 },
      { key: 'sessao', name: 'Sessão de terapia', durationMinutes: 45, priceCents: 15000 },
    ],
    windows: [
      { weekdays: [1, 3, 4], startTime: '08:00', endTime: '12:00' },
      { weekdays: [1, 3, 4], startTime: '14:00', endTime: '18:00' },
    ],
    timeOff: { inDays: 20, lengthDays: 7, reason: 'Férias' },
  },
];

const CLIENTS = [
  { key: 'lucas', name: 'Lucas Pereira' },
  { key: 'mariana', name: 'Mariana Alves' },
];

interface DemoBooking {
  client: string;
  provider: string;
  service: string;
  inDays: number;
  /** Where in the day's free slots to book, from 0 (first) to 1 (last). */
  position: number;
  cancel?: boolean;
}

const BOOKINGS: DemoBooking[] = [
  { client: 'lucas', provider: 'rafael', service: 'corte', inDays: 1, position: 0.3 },
  { client: 'mariana', provider: 'rafael', service: 'combo', inDays: 1, position: 0.7 },
  { client: 'lucas', provider: 'camila', service: 'treino', inDays: 2, position: 0.1 },
  { client: 'mariana', provider: 'helena', service: 'sessao', inDays: 3, position: 0.2 },
  { client: 'mariana', provider: 'camila', service: 'avaliacao', inDays: 4, position: 0.6 },
  {
    client: 'lucas',
    provider: 'helena',
    service: 'primeira',
    inDays: 5,
    position: 0.5,
    cancel: true,
  },
];

const demoEmail = (key: string) => `${key}${DEMO_EMAIL_DOMAIN}`;

// Deleting goes straight to Prisma: there is no use case for removing users, and
// the foreign keys are RESTRICT, so children go first.
async function removeDemoData(): Promise<void> {
  const demoUsers = { email: { endsWith: DEMO_EMAIL_DOMAIN } };
  await prisma.$transaction([
    prisma.appointment.deleteMany({
      where: { OR: [{ provider: demoUsers }, { client: demoUsers }] },
    }),
    prisma.timeOff.deleteMany({ where: { provider: demoUsers } }),
    prisma.availability.deleteMany({ where: { provider: demoUsers } }),
    prisma.service.deleteMany({ where: { provider: demoUsers } }),
    prisma.user.deleteMany({ where: demoUsers }),
  ]);
}

async function main(): Promise<void> {
  // Creating through the use cases keeps the demo data honest: hashed passwords,
  // valid grids and bookings that pass every business rule.
  const app = createAppDependencies(prisma, env);
  await removeDemoData();

  const register = async (key: string, name: string, role: Role, timezone: string) => {
    const { user } = await app.registerUser.execute({
      name,
      email: demoEmail(key),
      password: DEMO_PASSWORD,
      role,
      timezone,
    });
    return user.id;
  };

  const providers = new Map<
    string,
    { id: string; timezone: string; services: Map<string, string> }
  >();
  for (const provider of PROVIDERS) {
    const id = await register(provider.key, provider.name, 'PROVIDER', provider.timezone);
    const services = new Map<string, string>();
    for (const { key, ...service } of provider.services) {
      services.set(key, (await app.createService.execute({ ...service, providerId: id })).id);
    }
    await app.replaceAvailability.execute({
      providerId: id,
      windows: provider.windows.flatMap(({ weekdays, startTime, endTime }) =>
        weekdays.map((weekday) => ({ weekday, startTime, endTime })),
      ),
    });
    if (provider.timeOff) {
      const firstDay = startOfDay(addDays(TZDate.tz(provider.timezone), provider.timeOff.inDays));
      await app.createTimeOff.execute({
        providerId: id,
        startsAt: new Date(firstDay.getTime()),
        endsAt: new Date(addDays(firstDay, provider.timeOff.lengthDays).getTime()),
        reason: provider.timeOff.reason,
      });
    }
    providers.set(provider.key, { id, timezone: provider.timezone, services });
  }

  const clients = new Map<string, string>();
  for (const client of CLIENTS) {
    clients.set(client.key, await register(client.key, client.name, 'CLIENT', 'America/Sao_Paulo'));
  }

  for (const booking of BOOKINGS) {
    const provider = providers.get(booking.provider);
    const serviceId = provider?.services.get(booking.service);
    const clientId = clients.get(booking.client);
    if (!provider || !serviceId || !clientId) {
      throw new Error(`Demo booking refers to unknown data: ${JSON.stringify(booking)}`);
    }

    let booked = false;
    // The planned day may be a day off, so look ahead for the first one with free slots.
    for (let offset = 0; offset < SEARCH_DAYS_FOR_FREE_SLOT; offset++) {
      const day = addDays(TZDate.tz(provider.timezone), booking.inDays + offset);
      const { slots } = await app.getAvailableSlots.execute({
        providerId: provider.id,
        serviceId,
        date: format(day, 'yyyy-MM-dd'),
      });
      const slot = slots[Math.floor((slots.length - 1) * booking.position)];
      if (!slot) {
        continue;
      }
      const appointment = await app.createAppointment.execute({
        clientId,
        providerId: provider.id,
        serviceId,
        startsAt: slot.start,
      });
      if (booking.cancel) {
        await app.cancelAppointment.execute({
          appointmentId: appointment.id,
          requesterId: clientId,
        });
      }
      booked = true;
      break;
    }
    if (!booked) {
      throw new Error(`No free slot found for demo booking: ${JSON.stringify(booking)}`);
    }
  }

  console.log(`Seed concluído. Senha de todos os usuários: ${DEMO_PASSWORD}`);
  for (const { key, name } of [...PROVIDERS, ...CLIENTS]) {
    console.log(`  ${demoEmail(key)}  (${name})`);
  }
}

await main().finally(() => prisma.$disconnect());
