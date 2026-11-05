import type { Page } from '../pagination.js';
import type {
  AppointmentRepository,
  ClientAppointmentsQuery,
  ClientAppointmentView,
} from '../ports/appointment-repository.js';

export type ListClientAppointmentsInput = ClientAppointmentsQuery;

export class ListClientAppointments {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(input: ListClientAppointmentsInput): Promise<Page<ClientAppointmentView>> {
    const { items, total } = await this.appointmentRepository.listByClient(input);
    return { data: items, meta: { page: input.page, perPage: input.perPage, total } };
  }
}
