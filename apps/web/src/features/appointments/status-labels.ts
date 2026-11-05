import type { Appointment } from '../../api/booking';

export const STATUS_LABELS: Record<Appointment['status'], string> = {
  SCHEDULED: 'Agendado',
  CANCELED: 'Cancelado',
  COMPLETED: 'Concluído',
  NO_SHOW: 'Não compareceu',
};
