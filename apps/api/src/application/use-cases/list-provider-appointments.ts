import type {
  AppointmentRepository,
  ProviderAppointmentsQuery,
  ProviderAppointmentView,
} from '../ports/appointment-repository.js';

export type ListProviderAppointmentsInput = ProviderAppointmentsQuery;

// Not paginated: the HTTP layer caps the range at a few weeks, which keeps the list small.
export class ListProviderAppointments {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  execute(input: ListProviderAppointmentsInput): Promise<ProviderAppointmentView[]> {
    return this.appointmentRepository.listByProvider(input);
  }
}
