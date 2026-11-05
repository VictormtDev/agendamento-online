import { subHours } from 'date-fns';
import { CLIENT_CANCELLATION_NOTICE_HOURS } from '../scheduling-rules.js';

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

/** Exactly 24 hours before the start still counts as in time. */
export function isWithinClientCancellationDeadline(startsAt: Date, now: Date): boolean {
  return now <= subHours(startsAt, CLIENT_CANCELLATION_NOTICE_HOURS);
}
