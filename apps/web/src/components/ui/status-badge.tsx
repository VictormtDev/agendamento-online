import { CalendarClock, CircleCheck, CircleX, UserX, type LucideIcon } from 'lucide-react';
import type { Appointment } from '../../api/booking';
import { STATUS_LABELS } from '../../features/appointments/status-labels';

const STYLES: Record<Appointment['status'], { icon: LucideIcon; className: string }> = {
  SCHEDULED: { icon: CalendarClock, className: 'bg-saffron-100 text-saffron-700' },
  CANCELED: { icon: CircleX, className: 'bg-ruby-50 text-ruby-700' },
  COMPLETED: { icon: CircleCheck, className: 'bg-eucalyptus-100 text-eucalyptus-800' },
  NO_SHOW: { icon: UserX, className: 'bg-line text-muted' },
};

export function StatusBadge({ status }: { status: Appointment['status'] }) {
  const { icon: Icon, className } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}
