import type { RequestHandler } from 'express';
import type { GetProviderProfile } from '../../../application/use-cases/get-provider-profile.js';
import type { ListProviders } from '../../../application/use-cases/list-providers.js';
import { idParamsSchema } from '../schemas/id-params-schema.js';
import { paginationQuerySchema } from '../schemas/pagination-schema.js';

export function createListProvidersController(listProviders: ListProviders): RequestHandler {
  return async (request, response) => {
    const pagination = paginationQuerySchema.parse(request.query);
    const page = await listProviders.execute(pagination);
    response.status(200).json(page);
  };
}

export function createGetProviderProfileController(
  getProviderProfile: GetProviderProfile,
): RequestHandler {
  return async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const { provider, services } = await getProviderProfile.execute({ providerId: id });
    // Only what a client needs to choose: internal fields such as active stay out.
    response.status(200).json({
      provider,
      services: services.map(({ id: serviceId, name, durationMinutes, priceCents }) => ({
        id: serviceId,
        name,
        durationMinutes,
        priceCents,
      })),
    });
  };
}
