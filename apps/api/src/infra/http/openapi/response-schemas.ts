import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '../../../domain/entities/appointment.js';
import { ROLES } from '../../../domain/entities/user.js';

// Responses are built by the controllers from domain objects, so these schemas exist
// only to document them; requests are documented from the schemas that validate them.
export const responseRegistry = z.registry<{ id: string }>();

const instant = z.iso.datetime();

export const userSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    role: z.enum(ROLES),
    timezone: z.string().meta({ example: 'America/Sao_Paulo' }),
    createdAt: instant,
  })
  .register(responseRegistry, { id: 'User' });

export const authResponseSchema = z
  .object({ user: userSchema, accessToken: z.string() })
  .register(responseRegistry, { id: 'AuthResponse' });

export const serviceSchema = z
  .object({
    id: z.uuid(),
    providerId: z.uuid(),
    name: z.string(),
    durationMinutes: z.int(),
    priceCents: z.int().meta({ description: 'Preço em centavos' }),
    active: z.boolean(),
    createdAt: instant,
  })
  .register(responseRegistry, { id: 'Service' });

export const serviceSummarySchema = serviceSchema
  .pick({ id: true, name: true, durationMinutes: true, priceCents: true })
  .register(responseRegistry, { id: 'ServiceSummary' });

export const providerSummarySchema = z
  .object({ id: z.uuid(), name: z.string(), activeServiceCount: z.int() })
  .register(responseRegistry, { id: 'ProviderSummary' });

const publicProviderSchema = z.object({ id: z.uuid(), name: z.string(), timezone: z.string() });

export const providerProfileSchema = z
  .object({ provider: publicProviderSchema, services: z.array(serviceSummarySchema) })
  .register(responseRegistry, { id: 'ProviderProfile' });

export const slotsResponseSchema = z
  .object({
    timezone: z.string().meta({ description: 'Fuso do provider, para exibir os horários' }),
    slots: z.array(z.object({ startsAt: instant, endsAt: instant })),
  })
  .register(responseRegistry, { id: 'SlotsResponse' });

export const availabilitySchema = z
  .object({
    id: z.uuid(),
    providerId: z.uuid(),
    weekday: z.int().meta({ description: '0 = domingo … 6 = sábado' }),
    startTime: z.string().meta({ example: '09:00' }),
    endTime: z.string().meta({ example: '18:00' }),
  })
  .register(responseRegistry, { id: 'Availability' });

export const timeOffSchema = z
  .object({
    id: z.uuid(),
    providerId: z.uuid(),
    startsAt: instant,
    endsAt: instant,
    reason: z.string().nullable(),
    createdAt: instant,
  })
  .register(responseRegistry, { id: 'TimeOff' });

export const appointmentSchema = z
  .object({
    id: z.uuid(),
    providerId: z.uuid(),
    clientId: z.uuid(),
    serviceId: z.uuid(),
    startsAt: instant,
    endsAt: instant,
    status: z.enum(APPOINTMENT_STATUSES),
    canceledAt: instant.nullable(),
    createdAt: instant,
  })
  .register(responseRegistry, { id: 'Appointment' });

export const clientAppointmentSchema = appointmentSchema
  .extend({ service: serviceSummarySchema, provider: publicProviderSchema })
  .register(responseRegistry, { id: 'ClientAppointment' });

export const providerAppointmentSchema = appointmentSchema
  .extend({
    service: serviceSummarySchema,
    client: z.object({ id: z.uuid(), name: z.string() }),
  })
  .register(responseRegistry, { id: 'ProviderAppointment' });

export const errorSchema = z
  .object({
    error: z.object({
      code: z.string().meta({ example: 'SLOT_UNAVAILABLE' }),
      message: z.string().meta({ example: 'Horário indisponível' }),
      details: z.record(z.string(), z.unknown()).meta({
        description: 'Em VALIDATION_ERROR, traz issues: [{ path, message }]',
      }),
    }),
  })
  .register(responseRegistry, { id: 'Error' });

const pageMetaSchema = z
  .object({ page: z.int(), perPage: z.int(), total: z.int() })
  .register(responseRegistry, { id: 'PageMeta' });

export const providerPageSchema = z
  .object({ data: z.array(providerSummarySchema), meta: pageMetaSchema })
  .register(responseRegistry, { id: 'ProviderPage' });

export const clientAppointmentPageSchema = z
  .object({ data: z.array(clientAppointmentSchema), meta: pageMetaSchema })
  .register(responseRegistry, { id: 'ClientAppointmentPage' });
