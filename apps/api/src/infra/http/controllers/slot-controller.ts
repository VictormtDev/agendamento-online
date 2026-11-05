import type { RequestHandler } from 'express';
import type { GetAvailableSlots } from '../../../application/use-cases/get-available-slots.js';
import { idParamsSchema } from '../schemas/id-params-schema.js';
import { slotsQuerySchema } from '../schemas/slot-schemas.js';

export function createGetAvailableSlotsController(
  getAvailableSlots: GetAvailableSlots,
): RequestHandler {
  return async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const { serviceId, date } = slotsQuerySchema.parse(request.query);
    const { timezone, slots } = await getAvailableSlots.execute({
      providerId: id,
      serviceId,
      date,
    });
    // The timezone goes along so the client can show the times as the provider sees them.
    response.status(200).json({
      timezone,
      slots: slots.map((slot) => ({ startsAt: slot.start, endsAt: slot.end })),
    });
  };
}
