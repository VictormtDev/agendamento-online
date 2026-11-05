import { z } from 'zod';
import {
  clientAppointmentsQuerySchema,
  createAppointmentBodySchema,
  providerAppointmentsQuerySchema,
} from '../schemas/appointment-schemas.js';
import { loginBodySchema, registerBodySchema } from '../schemas/auth-schemas.js';
import { replaceAvailabilityBodySchema } from '../schemas/availability-schemas.js';
import { idParamsSchema } from '../schemas/id-params-schema.js';
import { paginationQuerySchema } from '../schemas/pagination-schema.js';
import { updateProfileBodySchema } from '../schemas/profile-schemas.js';
import { createServiceBodySchema, updateServiceBodySchema } from '../schemas/service-schemas.js';
import { slotsQuerySchema } from '../schemas/slot-schemas.js';
import { createTimeOffBodySchema } from '../schemas/time-off-schemas.js';
import {
  appointmentSchema,
  authResponseSchema,
  availabilitySchema,
  clientAppointmentPageSchema,
  errorSchema,
  providerAppointmentSchema,
  providerPageSchema,
  providerProfileSchema,
  responseRegistry,
  serviceSchema,
  slotsResponseSchema,
  timeOffSchema,
  userSchema,
} from './response-schemas.js';

type JsonSchema = Record<string, unknown>;
type Access = 'public' | 'authenticated' | 'provider';

interface Operation {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  tag: string;
  summary: string;
  description?: string;
  access: Access;
  pathParams?: z.ZodObject;
  query?: z.ZodObject;
  body?: z.ZodType;
  success: { status: number; description: string; schema?: JsonSchema };
  /** Error codes by HTTP status, beyond validation and auth, which are derived. */
  errors?: Record<number, string[]>;
}

const COMPONENT_PREFIX = '#/components/schemas/';

function ref(schema: z.ZodType): JsonSchema {
  const id = responseRegistry.get(schema)?.id;
  if (!id) {
    throw new Error('Response schemas must be registered in responseRegistry');
  }
  return { $ref: COMPONENT_PREFIX + id };
}

/** Most responses wrap the resource in a named key, e.g. { "service": {...} }. */
function wrapped(key: string, schema: JsonSchema): JsonSchema {
  return { type: 'object', required: [key], properties: { [key]: schema } };
}

function listOf(schema: z.ZodType): JsonSchema {
  return { type: 'array', items: ref(schema) };
}

// Zod emits its internal regex next to the format; the format alone reads better.
function dropPatternBesideFormat({ jsonSchema }: { jsonSchema: JsonSchema }): void {
  if (jsonSchema.format) {
    delete jsonSchema.pattern;
  }
}

// $schema is implied by the OpenAPI version, and $id would make Swagger UI resolve
// the $refs relative to it.
function embeddable(schema: JsonSchema): JsonSchema {
  const copy = { ...schema };
  delete copy.$schema;
  delete copy.$id;
  return copy;
}

// Requests are documented from the same schemas that validate them, so the docs
// cannot drift from what the API accepts. "input" describes what the client sends,
// before defaults and transforms are applied.
function requestSchema(schema: z.ZodType): JsonSchema {
  return embeddable(
    z.toJSONSchema(schema, {
      io: 'input',
      unrepresentable: 'any',
      override: dropPatternBesideFormat,
    }),
  );
}

function parameters(location: 'path' | 'query', schema: z.ZodObject): JsonSchema[] {
  const { properties = {}, required = [] } = requestSchema(schema) as {
    properties?: Record<string, JsonSchema>;
    required?: string[];
  };
  return Object.entries(properties).map(([name, property]) => ({
    name,
    in: location,
    required: location === 'path' || required.includes(name),
    schema: property,
  }));
}

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'Dados inválidos',
  401: 'Não autenticado',
  403: 'Sem permissão',
  404: 'Não encontrado',
  409: 'Conflito com uma regra de negócio',
  503: 'Serviço indisponível',
};

function errorResponses(operation: Operation): Record<string, JsonSchema> {
  const byStatus = new Map<number, string[]>();
  const add = (status: number, codes: string[]) => {
    byStatus.set(status, [...(byStatus.get(status) ?? []), ...codes]);
  };

  if (operation.body) {
    add(400, ['VALIDATION_ERROR', 'MALFORMED_JSON']);
  } else if (operation.pathParams ?? operation.query) {
    add(400, ['VALIDATION_ERROR']);
  }
  if (operation.access !== 'public') {
    add(401, ['UNAUTHENTICATED', 'INVALID_TOKEN']);
  }
  if (operation.access === 'provider') {
    add(403, ['FORBIDDEN']);
  }
  for (const [status, codes] of Object.entries(operation.errors ?? {})) {
    add(Number(status), codes);
  }

  return Object.fromEntries(
    [...byStatus.entries()]
      .sort(([a], [b]) => a - b)
      .map(([status, codes]) => [
        String(status),
        {
          description: `${ERROR_DESCRIPTIONS[status] ?? 'Erro'} (${codes.join(', ')})`,
          content: { 'application/json': { schema: ref(errorSchema) } },
        },
      ]),
  );
}

const ACCESS_NOTES: Record<Access, string> = {
  public: 'Rota pública.',
  authenticated: 'Requer autenticação.',
  provider: 'Requer autenticação com role PROVIDER.',
};

function toPathItem(operation: Operation): JsonSchema {
  const { status, description, schema } = operation.success;
  return {
    tags: [operation.tag],
    summary: operation.summary,
    description: [operation.description, ACCESS_NOTES[operation.access]]
      .filter(Boolean)
      .join('\n\n'),
    ...(operation.access !== 'public' && { security: [{ bearerAuth: [] }] }),
    parameters: [
      ...(operation.pathParams ? parameters('path', operation.pathParams) : []),
      ...(operation.query ? parameters('query', operation.query) : []),
    ],
    ...(operation.body && {
      requestBody: {
        required: true,
        content: { 'application/json': { schema: requestSchema(operation.body) } },
      },
    }),
    responses: {
      [String(status)]: {
        description,
        ...(schema && { content: { 'application/json': { schema } } }),
      },
      ...errorResponses(operation),
    },
  };
}

// Express writes "/services/:id"; OpenAPI writes "/services/{id}".
function toOpenApiPath(path: string): string {
  return path.replace(/:(\w+)/g, '{$1}');
}

const operations: Operation[] = [
  {
    method: 'get',
    path: '/health',
    tag: 'Health',
    summary: 'Verifica a API e o banco',
    access: 'public',
    success: { status: 200, description: 'API e banco disponíveis' },
    errors: { 503: ['DATABASE_UNAVAILABLE'] },
  },
  {
    method: 'post',
    path: '/auth/register',
    tag: 'Auth',
    summary: 'Cadastra um cliente ou profissional',
    access: 'public',
    body: registerBodySchema,
    success: { status: 201, description: 'Usuário criado', schema: ref(authResponseSchema) },
    errors: { 409: ['EMAIL_ALREADY_IN_USE'] },
  },
  {
    method: 'post',
    path: '/auth/login',
    tag: 'Auth',
    summary: 'Autentica e devolve o access token',
    access: 'public',
    body: loginBodySchema,
    success: { status: 200, description: 'Autenticado', schema: ref(authResponseSchema) },
    errors: { 401: ['INVALID_CREDENTIALS'] },
  },
  {
    method: 'get',
    path: '/me',
    tag: 'Perfil',
    summary: 'Perfil do usuário autenticado',
    access: 'authenticated',
    success: { status: 200, description: 'Perfil', schema: wrapped('user', ref(userSchema)) },
    errors: { 404: ['USER_NOT_FOUND'] },
  },
  {
    method: 'patch',
    path: '/me',
    tag: 'Perfil',
    summary: 'Atualiza o fuso horário (nome IANA)',
    access: 'authenticated',
    body: updateProfileBodySchema,
    success: {
      status: 200,
      description: 'Perfil atualizado',
      schema: wrapped('user', ref(userSchema)),
    },
    errors: { 404: ['USER_NOT_FOUND'] },
  },
  {
    method: 'post',
    path: '/services',
    tag: 'Serviços',
    summary: 'Cria um serviço',
    description: 'A duração deve ser múltipla de 15 minutos. O preço é em centavos.',
    access: 'provider',
    body: createServiceBodySchema,
    success: {
      status: 201,
      description: 'Serviço criado',
      schema: wrapped('service', ref(serviceSchema)),
    },
  },
  {
    method: 'patch',
    path: '/services/:id',
    tag: 'Serviços',
    summary: 'Atualiza um serviço do próprio provider',
    description: 'Envie ao menos um campo. Use active: false para desativar.',
    access: 'provider',
    pathParams: idParamsSchema,
    body: updateServiceBodySchema,
    success: {
      status: 200,
      description: 'Serviço atualizado',
      schema: wrapped('service', ref(serviceSchema)),
    },
    errors: { 404: ['SERVICE_NOT_FOUND'] },
  },
  {
    method: 'delete',
    path: '/services/:id',
    tag: 'Serviços',
    summary: 'Remove um serviço do próprio provider',
    access: 'provider',
    pathParams: idParamsSchema,
    success: { status: 204, description: 'Serviço removido' },
    errors: { 404: ['SERVICE_NOT_FOUND'] },
  },
  {
    method: 'get',
    path: '/availability',
    tag: 'Horários',
    summary: 'Lê a grade semanal',
    description: 'Ordenada por dia da semana e início, no fuso do provider.',
    access: 'provider',
    success: {
      status: 200,
      description: 'Grade semanal',
      schema: wrapped('availability', listOf(availabilitySchema)),
    },
  },
  {
    method: 'put',
    path: '/availability',
    tag: 'Horários',
    summary: 'Substitui a grade semanal inteira',
    description:
      'Horários em HH:mm, em múltiplos de 15 minutos, sem sobreposição no mesmo dia. Uma lista vazia limpa a grade.',
    access: 'provider',
    body: replaceAvailabilityBodySchema,
    success: {
      status: 200,
      description: 'Grade salva',
      schema: wrapped('availability', listOf(availabilitySchema)),
    },
  },
  {
    method: 'get',
    path: '/time-off',
    tag: 'Horários',
    summary: 'Lista as folgas não encerradas',
    description: 'Inclui uma folga em andamento. Ordenadas pelo início.',
    access: 'provider',
    success: {
      status: 200,
      description: 'Folgas',
      schema: wrapped('timeOffs', listOf(timeOffSchema)),
    },
  },
  {
    method: 'post',
    path: '/time-off',
    tag: 'Horários',
    summary: 'Cria uma folga',
    description: 'O fim deve ser depois do início e no futuro.',
    access: 'provider',
    body: createTimeOffBodySchema,
    success: {
      status: 201,
      description: 'Folga criada',
      schema: wrapped('timeOff', ref(timeOffSchema)),
    },
    errors: { 400: ['INVALID_TIME_OFF_PERIOD'] },
  },
  {
    method: 'delete',
    path: '/time-off/:id',
    tag: 'Horários',
    summary: 'Remove uma folga',
    access: 'provider',
    pathParams: idParamsSchema,
    success: { status: 204, description: 'Folga removida' },
    errors: { 404: ['TIME_OFF_NOT_FOUND'] },
  },
  {
    method: 'get',
    path: '/providers',
    tag: 'Profissionais',
    summary: 'Lista os profissionais com serviços ativos',
    access: 'public',
    query: paginationQuerySchema,
    success: {
      status: 200,
      description: 'Página de profissionais',
      schema: ref(providerPageSchema),
    },
  },
  {
    method: 'get',
    path: '/providers/:id',
    tag: 'Profissionais',
    summary: 'Perfil do profissional e seus serviços ativos',
    access: 'public',
    pathParams: idParamsSchema,
    success: { status: 200, description: 'Perfil', schema: ref(providerProfileSchema) },
    errors: { 404: ['PROVIDER_NOT_FOUND'] },
  },
  {
    method: 'get',
    path: '/providers/:id/slots',
    tag: 'Profissionais',
    summary: 'Horários livres de um serviço num dia',
    description:
      'O dia é interpretado no fuso do provider. Slots a cada 15 minutos, respeitando grade, folgas, agendamentos, antecedência de 2 horas e janela de 60 dias.',
    access: 'public',
    pathParams: idParamsSchema,
    query: slotsQuerySchema,
    success: { status: 200, description: 'Horários livres', schema: ref(slotsResponseSchema) },
    errors: { 404: ['PROVIDER_NOT_FOUND', 'SERVICE_NOT_FOUND'] },
  },
  {
    method: 'post',
    path: '/appointments',
    tag: 'Agendamentos',
    summary: 'Agenda um horário',
    description:
      'O cliente vem do token e o fim é calculado pela duração do serviço. Requisições simultâneas para o mesmo horário geram um único agendamento.',
    access: 'authenticated',
    body: createAppointmentBodySchema,
    success: {
      status: 201,
      description: 'Agendamento criado',
      schema: wrapped('appointment', ref(appointmentSchema)),
    },
    errors: {
      404: ['PROVIDER_NOT_FOUND', 'SERVICE_NOT_FOUND'],
      409: [
        'SLOT_UNAVAILABLE',
        'BOOKING_TOO_SOON',
        'BOOKING_TOO_FAR_AHEAD',
        'SELF_BOOKING_NOT_ALLOWED',
      ],
    },
  },
  {
    method: 'get',
    path: '/appointments',
    tag: 'Agendamentos',
    summary: 'Meus agendamentos (como cliente)',
    description: 'Do início mais recente para o mais antigo.',
    access: 'authenticated',
    query: clientAppointmentsQuerySchema,
    success: {
      status: 200,
      description: 'Página de agendamentos',
      schema: ref(clientAppointmentPageSchema),
    },
  },
  {
    method: 'patch',
    path: '/appointments/:id/cancel',
    tag: 'Agendamentos',
    summary: 'Cancela um agendamento',
    description:
      'O cliente pode cancelar até 24 horas antes do início; o provider, a qualquer momento antes do início. Terceiros recebem 404.',
    access: 'authenticated',
    pathParams: idParamsSchema,
    success: {
      status: 200,
      description: 'Agendamento cancelado',
      schema: wrapped('appointment', ref(appointmentSchema)),
    },
    errors: {
      404: ['APPOINTMENT_NOT_FOUND'],
      409: [
        'APPOINTMENT_ALREADY_CANCELED',
        'APPOINTMENT_ALREADY_STARTED',
        'CANCELLATION_DEADLINE_PASSED',
      ],
    },
  },
  {
    method: 'get',
    path: '/provider/appointments',
    tag: 'Agendamentos',
    summary: 'Agenda do provider num período',
    description: 'Agendamentos que cruzam o período, em ordem cronológica. Período de até 31 dias.',
    access: 'provider',
    query: providerAppointmentsQuerySchema,
    success: {
      status: 200,
      description: 'Agendamentos',
      schema: wrapped('data', listOf(providerAppointmentSchema)),
    },
  },
];

function componentSchemas(): JsonSchema {
  const { schemas } = z.toJSONSchema(responseRegistry, {
    uri: (id) => COMPONENT_PREFIX + id,
    override: dropPatternBesideFormat,
  });
  return Object.fromEntries(
    Object.entries(schemas).map(([id, schema]) => [id, embeddable(schema)]),
  );
}

export function createOpenApiDocument(): JsonSchema {
  const paths: Record<string, Record<string, JsonSchema>> = {};
  for (const operation of operations) {
    const path = toOpenApiPath(operation.path);
    paths[path] = { ...paths[path], [operation.method]: toPathItem(operation) };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'Agendamento Online API',
      version: '1.0.0',
      description:
        'Profissionais cadastram serviços e horários; clientes agendam online. Datas em ISO 8601 UTC; valores em centavos. Erros sempre no formato { error: { code, message, details } }.',
    },
    servers: [{ url: '/api/v1' }],
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: componentSchemas(),
    },
  };
}
