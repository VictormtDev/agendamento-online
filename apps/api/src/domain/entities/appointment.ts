export const APPOINTMENT_STATUSES = ['SCHEDULED', 'CANCELED', 'COMPLETED', 'NO_SHOW'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface Appointment {
  id: string;
  providerId: string;
  clientId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  canceledAt: Date | null;
  createdAt: Date;
}
